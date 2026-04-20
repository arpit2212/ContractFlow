package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	apiKey := "f4557c2999f0de5d994e2707f2c078ef65a61d88"
	url := "https://api.pandadoc.com/public/v1/documents"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return
	}

	req.Header.Set("Authorization", "API-Key "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %s\n", resp.Status)
	fmt.Printf("Response: %s\n", string(body))
}
