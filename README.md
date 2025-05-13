# ActiveCampaign API Proxy with Vercel

This project sets up a secure serverless API proxy using Vercel to add users to a newsletter list on ActiveCampaign without exposing the API key on the frontend.

## Setup

1. Clone this repo and deploy it to [Netlify](www.netlify.com).
2. In your Netlify dashboard, go to your project settings and add the following environment variables:

- `ACTIVE_CAMPAIGN_API_KEY` – Your ActiveCampaign API key
- `ACTIVE_CAMPAIGN_URL` – Your ActiveCampaign API base URL (e.g., `https://youraccount.api-us1.com`)
- `ACTIVE_CAMPAIGN_LIST_ID` – The list ID to subscribe users to
- `ACTIVE_CAMPAIGN_TAG_ID` – The tag ID to assign to the user after subscribing

3. Redeploy your project after setting environment variables.

## Usage

Send a POST request to `/api/subscribe` with a JSON body like:

```json
{
  "email": "user@example.com"
}
```

This will add the user to your ActiveCampaign list and assign them a tag securely.
