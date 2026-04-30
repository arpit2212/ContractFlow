# 📄 PandaDoc Service Web App – Deccan Vault

---

## 🚀 Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React + Tailwind CSS + Vite + TypeScript |
| Backend | Go (Golang) |
| Database | PostgreSQL (Supabase) |
| Authentication | Google OAuth 2.0 |
| Chatbot / RAG | OpenAI API + Pinecone + LangChain |

📚 PandaDoc Docs: https://developers.pandadoc.com/docs/getting-started  

---

## 🧩 System Overview

This platform is a secure web-based application that integrates **Google Authentication** and the **PandaDoc Public API** to streamline:

- Automated contract distribution  
- Centralized document management  
- Real-time analytics  

Users can:
- Authenticate via Google  
- Connect PandaDoc using an API key  
- Perform document operations via a dashboard  

---

## 🔗 Architecture Diagram


- ![Dashboard Screenshot]([https://your-image-link.com/image.png](https://github.com/arpit2212/ContractFlow/blob/main/ReadDocs/architecture.drawio.png))

---

## ⚙️ System Workflow

1. User logs in via Google  
2. Enters PandaDoc API key  
3. Dashboard fetches analytics  

### User Capabilities:
- View document analytics  
- Send individual contracts  
- Upload CSV for bulk sending  
- Access templates  

---

## ✨ Key Features

### 🔐 5.1 Google Authentication

- Secure login using Google OAuth 2.0  
- Only pre-authorized users allowed  
- No password management required  
- Scalable and secure access control  

---

### 🔗 5.2 PandaDoc API Integration & Security

- Uses user-provided API key  
- API key **not stored permanently**  
- Stored temporarily in session/local DB  
- Deleted on logout  

✅ Ensures:
- Data privacy  
- No backend exposure  
- Secure document handling  

---

### 📁 5.3 Document Management

- Centralized dashboard for all documents  
- Track statuses:
  - Draft  
  - Sent  
  - Viewed  
  - Completed  
  - Declined  

🔎 Features:
- Search & filtering  
- Real-time updates from PandaDoc API  

---

### 📤 5.4 Mass Contract Sending

Send contracts to multiple recipients efficiently.

#### Steps:
1. Select template  
2. Add recipients (Manual / CSV)  
3. Map variables  
4. Customize email  
5. Review  
6. Send  

---

#### 📥 5.4.1 Add Recipients

- Manual entry:
  - Name  
  - Email  
  - Variables  

- CSV Upload:
  - Bulk upload support  
  - Template-based format  
  - Auto-mapping of fields  

✅ Benefits:
- Reduces manual work  
- Scalable distribution  

---

#### ✉️ 5.4.2 Email Customization & Review

- Customize subject & message  
- Supports dynamic placeholders (e.g., name)  

✔ Review screen includes:
- Template  
- Recipients  
- Email preview  

---

## ⚠️ Current System Limitations

- Uses **Sandbox API Key**
- Restricted email sending (domain limitations)
- Limited to ~10 requests/minute  
- Not suitable for production-scale use  

👉 For real usage, **Production API Key is required**

---

## 🔑 Production API Key

### 📊 Rate Limits (RPM)

| API Action | Limit |
|-----------|------|
| Create Document (PDF) | 300 |
| Create Document (Template) | 500 |
| Send Document | 400 |
| Document Details | 600 |
| List / Delete | 2000 |
| Download Document | 100 |
| Sandbox API | 10 |

📌 Uses **sliding window (last 60 seconds)**  

⚠️ Exceeding limits → `429 Too Many Requests`

---

## ✅ Benefits of Production Key

- Full API functionality  
- Cross-domain email sending  
- Higher rate limits (~300 RPM)  
- Real-time workflows  
- Scalable for enterprise use  
- Reliable performance  
- Secure & compliant  

---

## 🔗 How to Get Production Key

👉 https://developers.pandadoc.com/reference/production-api-key  

---

## 🏁 Conclusion

This system provides a **secure and scalable contract automation platform** by integrating:

- Google OAuth 2.0  
- PandaDoc API  

### 💡 Key Advantages:
- Centralized contract management  
- Real-time analytics  
- Bulk contract sending via CSV  
- Dynamic data mapping  
- Customizable communication  

### 🔒 Security Highlights:
- Client-side API key handling  
- Restricted access  
- No credential exposure  

Although currently limited by sandbox constraints, the system is **fully production-ready in design** and can be scaled seamlessly for real-world deployment.

## 📁 Project Structure

```bash
root/
│
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── config/
│   │   └── env.go
│   ├── controllers/
│   │   ├── auth_controller.go
│   │   ├── contract_controller.go
│   │   └── pandadoc_controller.go
│   ├── middleware/
│   │   └── auth_middleware.go
│   ├── models/
│   │   ├── contract.go
│   │   ├── pandadoc_auth.go
│   │   └── user.go
│   ├── routes/
│   │   └── routes.go
│   ├── services/
│   │   ├── auth_service.go
│   │   ├── contract_service.go
│   │   ├── pandadoc_service.go
│   │   └── supabase_client.go
│   ├── .env
│   ├── .env.example
│   ├── go.mod
│   ├── go.sum
│   └── test_pandadoc.go
│
├── frontend/
│   ├── dist/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── DocumentsTable.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePandaDocs.ts
│   │   │   └── usePandaDocApiKey.ts
│   │   ├── pages/
│   │   │   ├── BulkSend.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── SendContract.tsx
│   │   │   └── Templates.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── README.md


## ⚙️ How to Run the Project

### ▶️ Backend Setup (Go)

```bash
cd backend

go mod tidy

cp .env.example .env
# update values

go run cmd/main.go

### ▶️ Frontend Setup (React)

cd frontend

npm install

cp .env.example .env
# update values

npm run dev
