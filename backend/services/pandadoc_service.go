package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

type PandaDocAnalytics struct {
	Total     int `json:"total"`
	Draft     int `json:"draft"`
	Sent      int `json:"sent"`
	Viewed    int `json:"viewed"`
	Completed int `json:"completed"`
	Declined  int `json:"declined"`
}

type PandaDocServiceInterface interface {
	GetDocuments(ctx context.Context, userID, apiKey string, page, limit int, bypassCache bool) ([]interface{}, int, error)
	GetDocumentDetails(ctx context.Context, userID, apiKey, id string) (interface{}, error)
	GetTemplates(ctx context.Context, userID, apiKey string) ([]interface{}, error)
	GetTemplateDetails(ctx context.Context, userID, apiKey, id string) (interface{}, error)
	CreateDocument(ctx context.Context, userID, apiKey string, payload interface{}) (interface{}, error)
	UpdateDocument(ctx context.Context, userID, apiKey, id string, payload interface{}) (interface{}, error)
	SendDocument(ctx context.Context, userID, apiKey, id string, payload interface{}) (interface{}, error)
	CreateAndSendDocument(ctx context.Context, userID, apiKey string, payload interface{}) (interface{}, error)
	BulkCreateAndSendDocuments(ctx context.Context, userID, apiKey string, payloads []interface{}) ([]interface{}, error)
	GetAnalytics(ctx context.Context, userID, apiKey string) (*PandaDocAnalytics, error)
}

type pandaDocService struct {
	BaseURL string
	cache   sync.Map
}

type cacheItem struct {
	data      interface{}
	expiresAt time.Time
}

func NewPandaDocService() PandaDocServiceInterface {
	return &pandaDocService{
		BaseURL: "https://api.pandadoc.com/public/v1",
	}
}

func (s *pandaDocService) getFromCache(key string) (interface{}, bool) {
	val, ok := s.cache.Load(key)
	if !ok {
		return nil, false
	}
	item := val.(cacheItem)
	if time.Now().After(item.expiresAt) {
		s.cache.Delete(key)
		return nil, false
	}
	return item.data, true
}

func (s *pandaDocService) setToCache(key string, data interface{}) {
	s.cache.Store(key, cacheItem{
		data:      data,
		expiresAt: time.Now().Add(60 * time.Second),
	})
}

func (s *pandaDocService) doRequest(ctx context.Context, userID, apiKey, method, path string, body interface{}, result interface{}) error {
	fullURL := s.BaseURL + path
	log.Printf("PandaDoc Request: %s %s (User: %s)", method, fullURL, userID)

	var bodyReader io.Reader
	var bodyCopy []byte
	if body != nil {
		var err error
		bodyCopy, err = json.Marshal(body)
		if err != nil {
			return err
		}
		log.Printf("PandaDoc Request Body: %s", string(bodyCopy))
		bodyReader = bytes.NewBuffer(bodyCopy)
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
	if err != nil {
		return err
	}

	if apiKey != "" {
		log.Printf("Using user-provided API Key for user %s", userID)
		req.Header.Set("Authorization", "API-Key "+apiKey)
	} else {
		log.Printf("WARNING: No API key provided for user %s", userID)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("PandaDoc Request failed: %v", err)
		return err
	}
	defer resp.Body.Close()

	log.Printf("PandaDoc Response: %d %s", resp.StatusCode, resp.Status)

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("PandaDoc API Error Status: %d, Body: %s", resp.StatusCode, string(respBody))

		if resp.StatusCode == http.StatusUnauthorized {
			return fmt.Errorf("invalid PandaDoc API key")
		}
		if resp.StatusCode == http.StatusForbidden {
			return fmt.Errorf("PandaDoc API key does not have permission for this action (403 Forbidden)")
		}
		if resp.StatusCode == http.StatusNotFound {
			return fmt.Errorf("PandaDoc endpoint not found (404 Not Found): %s", path)
		}
		if resp.StatusCode == http.StatusTooManyRequests {
			return fmt.Errorf("PandaDoc API rate limit exceeded (429 Too Many Requests)")
		}

		return fmt.Errorf("PandaDoc API Error (%d): %s", resp.StatusCode, string(respBody))
	}

	// Read body for logging and decoding
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}

	// Log a snippet of the response for debugging
	bodySnippet := string(respBody)
	if len(bodySnippet) > 200 {
		bodySnippet = bodySnippet[:200] + "..."
	}
	log.Printf("PandaDoc Response Body (%d bytes): %s", len(respBody), bodySnippet)

	if len(respBody) == 0 {
		log.Printf("PandaDoc: Empty response body for %s", path)
		return nil
	}

	err = json.Unmarshal(respBody, result)
	if err != nil {
		// Try to see if it's a simple list when we expected an object or vice versa
		log.Printf("PandaDoc: Failed to decode response into expected type: %v. Body: %s", err, string(respBody))
		return fmt.Errorf("failed to decode PandaDoc response: %v", err)
	}

	return nil
}

func (s *pandaDocService) GetDocuments(ctx context.Context, userID, apiKey string, page, limit int, bypassCache bool) ([]interface{}, int, error) {
	// Include a hash of the API key in the cache key
	apiKeyHash := fmt.Sprintf("%x", sha256.Sum256([]byte(apiKey)))
	cacheKey := fmt.Sprintf("docs_%s_%s_page%d_limit%d", userID, apiKeyHash[:8], page, limit)

	if !bypassCache {
		if data, ok := s.getFromCache(cacheKey); ok {
			cached := data.(map[string]interface{})
			return cached["items"].([]interface{}), cached["total"].(int), nil
		}
	}

	log.Printf("PandaDoc: Fetching documents for user %s, page %d, limit %d", userID, page, limit)

	// We try to decode into a generic map first
	var rawResponse map[string]interface{}
	err := s.doRequest(ctx, userID, apiKey, http.MethodGet, fmt.Sprintf("/documents?count=%d&page=%d", limit, page), nil, &rawResponse)

	if err != nil {
		log.Printf("PandaDoc: GetDocuments first attempt (map) failed: %v", err)
		// Fallback: Check if the response is actually a direct list
		var directList []interface{}
		if fallbackErr := s.doRequest(ctx, userID, apiKey, http.MethodGet, fmt.Sprintf("/documents?count=%d&page=%d", limit, page), nil, &directList); fallbackErr == nil {
			log.Printf("PandaDoc: Detected direct list response (%d items)", len(directList))
			s.setToCache(cacheKey, map[string]interface{}{"items": directList, "total": len(directList)})
			return directList, len(directList), nil
		} else {
			log.Printf("PandaDoc: GetDocuments fallback attempt (list) also failed: %v", fallbackErr)
		}
		return nil, 0, err
	}

	keys := getMapKeys(rawResponse)
	log.Printf("PandaDoc: GetDocuments successful response. Keys found: %v", keys)

	// Try to find results in common keys
	var results []interface{}
	var ok bool

	if results, ok = rawResponse["results"].([]interface{}); !ok {
		if results, ok = rawResponse["items"].([]interface{}); !ok {
			if results, ok = rawResponse["documents"].([]interface{}); !ok {
				// If still not found, check if any key contains a list
				for k, v := range rawResponse {
					if list, ok := v.([]interface{}); ok {
						results = list
						log.Printf("PandaDoc: Found potential results in key '%s'", k)
						break
					}
				}
			}
		}
	}

	if results != nil {
		total := 0
		if count, ok := rawResponse["count"].(float64); ok {
			total = int(count)
		} else if totalInt, ok := rawResponse["total_count"].(float64); ok {
			total = int(totalInt)
		} else if totalInt, ok := rawResponse["total"].(float64); ok {
			total = int(totalInt)
		}

		if total < len(results) {
			total = len(results)
		}

		log.Printf("PandaDoc: Returning %d documents (total: %d)", len(results), total)
		s.setToCache(cacheKey, map[string]interface{}{"items": results, "total": total})
		return results, total, nil
	}

	log.Printf("PandaDoc: No results found in response. Keys: %v", keys)
	return []interface{}{}, 0, nil
}

// Helper to log map keys for debugging
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func (s *pandaDocService) GetDocumentDetails(ctx context.Context, userID, apiKey, id string) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, apiKey, http.MethodGet, "/documents/"+id, nil, &result)
	return result, err
}

func (s *pandaDocService) GetTemplates(ctx context.Context, userID, apiKey string) ([]interface{}, error) {
	// Include a hash of the API key in the cache key
	apiKeyHash := fmt.Sprintf("%x", sha256.Sum256([]byte(apiKey)))
	cacheKey := fmt.Sprintf("templates_%s_%s", userID, apiKeyHash[:8])

	if data, ok := s.getFromCache(cacheKey); ok {
		return data.([]interface{}), nil
	}

	var response struct {
		Results []interface{} `json:"results"`
	}
	err := s.doRequest(ctx, userID, apiKey, http.MethodGet, "/templates", nil, &response)
	if err != nil {
		return nil, err
	}

	s.setToCache(cacheKey, response.Results)
	return response.Results, nil
}

func (s *pandaDocService) GetTemplateDetails(ctx context.Context, userID, apiKey, id string) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, apiKey, http.MethodGet, "/templates/"+id+"/details", nil, &result)
	return result, err
}

func (s *pandaDocService) CreateDocument(ctx context.Context, userID, apiKey string, payload interface{}) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, apiKey, http.MethodPost, "/documents", payload, &result)
	return result, err
}

func (s *pandaDocService) UpdateDocument(ctx context.Context, userID, apiKey, id string, payload interface{}) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, apiKey, http.MethodPatch, "/documents/"+id, payload, &result)
	return result, err
}

func (s *pandaDocService) SendDocument(ctx context.Context, userID, apiKey, id string, payload interface{}) (interface{}, error) {
	maxRetries := 10
	retryInterval := 2 * time.Second

	var status string
	for i := 0; i < maxRetries; i++ {
		var doc struct {
			Status string `json:"status"`
		}
		err := s.doRequest(ctx, userID, apiKey, http.MethodGet, "/documents/"+id, nil, &doc)
		if err == nil {
			status = doc.Status
			log.Printf("Document %s status: %s (attempt %d)", id, status, i+1)
			if status == "document.draft" {
				break
			}
		} else {
			log.Printf("Error checking document status: %v", err)
		}

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(retryInterval):
		}
	}

	if status != "document.draft" {
		return nil, fmt.Errorf("document is not in draft status (current status: %s), cannot send", status)
	}

	var result interface{}
	err := s.doRequest(ctx, userID, apiKey, http.MethodPost, "/documents/"+id+"/send", payload, &result)
	return result, err
}

func (s *pandaDocService) CreateAndSendDocument(ctx context.Context, userID, apiKey string, payload interface{}) (interface{}, error) {
	var data map[string]interface{}
	payloadBytes, _ := json.Marshal(payload)
	json.Unmarshal(payloadBytes, &data)

	sendSettings := map[string]interface{}{
		"silent": false,
	}
	if msg, ok := data["message"]; ok {
		sendSettings["message"] = msg
		delete(data, "message")
	}
	if subj, ok := data["subject"]; ok {
		sendSettings["subject"] = subj
		delete(data, "subject")
	}

	log.Printf("Creating PandaDoc document with name: %v", data["name"])

	var createResult struct {
		ID string `json:"id"`
	}
	err := s.doRequest(ctx, userID, apiKey, http.MethodPost, "/documents", data, &createResult)
	if err != nil {
		return nil, err
	}

	return s.SendDocument(ctx, userID, apiKey, createResult.ID, sendSettings)
}

func (s *pandaDocService) BulkCreateAndSendDocuments(ctx context.Context, userID, apiKey string, payloads []interface{}) ([]interface{}, error) {
	results := make([]interface{}, 0, len(payloads))

	for _, payload := range payloads {
		res, err := s.CreateAndSendDocument(ctx, userID, apiKey, payload)
		if err != nil {
			log.Printf("Bulk send error for one item: %v", err)
			results = append(results, map[string]interface{}{"error": err.Error(), "payload": payload})
		} else {
			results = append(results, res)
		}

		time.Sleep(1 * time.Second)
	}

	return results, nil
}

func (s *pandaDocService) GetAnalytics(ctx context.Context, userID, apiKey string) (*PandaDocAnalytics, error) {
	docs, _, err := s.GetDocuments(ctx, userID, apiKey, 1, 100, false)
	if err != nil {
		return nil, err
	}

	analytics := &PandaDocAnalytics{
		Total: len(docs),
	}

	for _, d := range docs {
		docMap, ok := d.(map[string]interface{})
		if !ok {
			continue
		}
		status, _ := docMap["status"].(string)
		switch status {
		case "document.draft":
			analytics.Draft++
		case "document.sent":
			analytics.Sent++
		case "document.viewed":
			analytics.Viewed++
		case "document.completed":
			analytics.Completed++
		case "document.declined":
			analytics.Declined++
		}
	}

	return analytics, nil
}
