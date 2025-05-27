# 1. Jídlo Lépe – Backend & Frontend

> Semestrální projekt: Aplikace pro správu alergenů a uživatelů – mobilní frontend v React Native a zabezpečený backend ve Spring Boot

## 2. Cíl projektu

Cílem této práce je navrhnout a implementovat plně funkční backend i frontend systému „Jídlo Lépe“ pro alergiky, který:

* umožňuje správu uživatelů a jejich alergenů
* využívá JWT autentizaci a role-based autorizaci
* podporuje validaci dat a logování
* poskytuje REST API pro mobilní aplikaci
* umožňuje skenování čárových kódů a porovnání složení s alergenem uživatele

## 3. Architektura systému

Aplikace je rozdělena do dvou částí – backend a frontend – propojené pomocí REST API.

### Backend (Spring Boot)

* **Entity** – `User`, `Allergen`, `Role`
* **DTO** – `UserDTO`, `LoginDTO`, `AuthResponse`
* **Repository** – `UserRepository`, `AllergenRepository`
* **Service** – `UserService`, `AuthService`
* **Controller** – `UserController`, `AuthController`
* **Security** – `SecurityConfig`, `JwtFilter`, `JwtUtil`

### Frontend (React Native + Expo Router)

* **Stránky:** login, fav, profile, product detail (`[id].tsx`), scan
* **Autentizace** – uložení JWT pomocí `AsyncStorage`
* **Context API** – `authContext` pro správu stavu přihlášení
* **CameraView** – Expo kamera pro čtení čárových kódů
* **Porovnání alergenů** – nahrané alergeny vs složení produktu

## 4. Bezpečnostní mechanismy

* **JWT autentizace** – uživatel získá token po přihlášení a posílá jej v hlavičce `Authorization: Bearer <token>`
* **Role-based access control** – `ADMIN`, `USER`, `EDITOR`
* **Ochrana endpointů** – jen oprávnění uživatelé mohou volat určité API

## 5. Validace

* Validace emailu a hesla v `LoginDTO`
* Validace ID a seznamu alergenů v `UserDTO`

Při chybném vstupu je vrácen srozumitelný výstup s HTTP stavovým kódem:

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json
{
  "error": "Email is required"
}
```

## 6. Ukázky API response

### 6.1 Úspěšný login

```http
POST /api/auth/login
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### 6.2 Aktualizace alergenů

```http
PUT /api/users/allergens
Authorization: Bearer <token>
```

```json
{
  "allergens": ["Lepek", "Mléko"]
}
```

```json
{
  "email": "jitka@example.com",
  "allergens": ["Lepek", "Mléko"]
}
```

## 7. Dokumentace API (Swagger)

Swagger UI je dostupné po spuštění aplikace na:

```
http://localhost:8082/swagger-ui/index.html
```

## 8. Logování a monitoring

* Logování pomocí SLF4J + Logback
* Logování přístupů a chyb v `AuthService`, `JwtUtil`, `UserService`
## 9. Spuštění projektu

### 9.1 Backend

#### Požadavky:

* Java 17+
* Maven
* PostgreSQL

#### Spuštění:

```bash
./mvnw spring-boot:run
```

### 9.2 Frontend

#### Požadavky:

* Node.js, npm
* Expo CLI (`npm install -g expo-cli`)

#### Spuštění:

```bash
npm install
npm start
```

#### Přístup z mobilu:

Aplikace je vyvíjena pomocí **Expo Go** – připojením telefonu ke stejné WiFi síti lze testovat přes QR kód.

## 10. Struktura backend projektu

```
├── controller
│   ├── AuthController.java
│   └── UserController.java
├── dto
│   ├── LoginDTO.java
│   ├── AuthResponse.java
│   └── UserDTO.java
├── entity
│   ├── User.java
│   ├── Role.java
│   └── Allergen.java
├── repository
│   └── UserRepository.java
├── service
│   ├── AuthService.java
│   └── UserService.java
├── security
│   ├── SecurityConfig.java
│   ├── JwtUtil.java
│   └── JwtRequestFilter.java
└── ...
```

## 11. Kontakt

Autor: **Jitka Kroupová** – studentem UPCE FEI

Repozitář: [github.com/avarza1/jidlolepe](https://github.com/avarza1/jidlolepe)
