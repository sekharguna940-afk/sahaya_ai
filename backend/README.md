# CivicAI — Backend Lambda Functions

This directory contains the AWS Lambda function source code for the CivicAI platform.

## Lambda Functions

| Function | Route | Description |
|----------|-------|-------------|
| `auth/` | `POST /auth/send-otp`, `POST /auth/verify-otp` | OTP-based phone authentication via AWS SNS |
| `generate_upload_url/` | `POST /upload/presign` | Generates presigned S3 PUT URLs for direct image upload |
| `process_image/` | *(S3 trigger)* | AI pipeline — YOLO inference → severity → Bedrock description → DynamoDB |
| `submit_complaint/` | `POST /complaints` | Finalizes complaint with user notes, GPS, and sets status to "Submitted" |
| `get_user_complaints/` | `GET /complaints` | Lists complaints, optionally filtered by `phone` query parameter |
| `get_complaint/` | `GET /complaints/{id}` | Retrieves a single complaint by `incident_id` |
| `farmer_profile/` | `GET/PATCH /api/farmer/profile` | Authenticated farmer profile and farm details |
| `farmer_crops/` | `GET/POST/PATCH/DELETE /api/farmer/crops` | Authenticated farmer crop records |
| `farmer_cases/` | `GET/POST /api/farmer/cases` | Authenticated farmer assistance cases |
| `farmer_schemes/` | `GET /api/farmer/schemes` | Authenticated live scheme lookup via data.gov.in |

Farmer handlers require a bearer token whose phone exists in `Users` with
`role = farmer`. The role is read from DynamoDB server-side; frontend role
selection is not trusted.

## Environment Variables

All Lambdas use:
- `REGION` — AWS region (default: `ap-south-1`)
- `TABLE_NAME` — DynamoDB table name (default: `Complaints`)

Additional per-function:
- **auth**: `JWT_SECRET` — signing key for token generation
- **generate_upload_url**: `BUCKET_NAME`, `URL_EXPIRY`
- **process_image**: `EC2_ENDPOINT`, `SES_SOURCE_EMAIL`, `YOLO_TIMEOUT`
- **farmer_profile**: `FARMER_PROFILES_TABLE` (default `FarmerProfiles`), `USERS_TABLE`
- **farmer_crops**: `FARMER_CROPS_TABLE` (default `FarmerCrops`), `USERS_TABLE`
- **farmer_cases**: `FARMER_CASES_TABLE` (default `FarmerCases`), `USERS_TABLE`
- **farmer_schemes**: `SCHEMES_API_KEY`, `SCHEMES_RESOURCE_ID`, `SCHEMES_API_BASE_URL` (default `https://api.data.gov.in/resource`)

### Live government schemes

The `farmer_schemes` Lambda uses the Government of India's Open Government Data
API. Create a free account at [data.gov.in](https://data.gov.in/), generate an
API key, and set it as the Lambda environment variable `SCHEMES_API_KEY`.
Set `SCHEMES_RESOURCE_ID` to the resource UUID of the scheme dataset you choose
from the portal. The key stays in Lambda and is never sent to the browser.

Add an API Gateway route for `GET /api/farmer/schemes` to this Lambda. The
frontend already sends `state`, `district`, and `crop` query parameters.

## Deployment

Each function is deployed as a separate AWS Lambda. See [docs/aws_lambda_gateway_setup.md](../docs/aws_lambda_gateway_setup.md) for full setup instructions.
