# ActiveCampaign API Proxy with Netlify

This project sets up a secure serverless API proxy using Netlify to add users to a newsletter list on ActiveCampaign without exposing the API key on the frontend.

## Setup

1. Clone this repo and deploy it to [Netlify](www.netlify.com).
2. In your Netlify dashboard, go to your project settings and add the following environment variables:

- `ACTIVE_CAMPAIGN_API_KEY` – Your ActiveCampaign API key
- `ACTIVE_CAMPAIGN_URL` – Your ActiveCampaign API base URL (e.g., `https://youraccount.api-us1.com`)
- `ACTIVE_CAMPAIGN_LIST_ID` – The list ID to subscribe users to
- `ACTIVE_CAMPAIGN_TAG_ID` – The tag ID to assign to the user after subscribing

You can get these credentials from your ActiveCampaign admin account page.

3. Make sure the "Build command" is set to `npm install` and the Functions directory is set to `netlify/functions`.
4. Redeploy your project after setting environment variables.

## Usage

Send a POST request to `.netlify/functions/subscribe` with a JSON body like:

```json
{
  "email": "user@example.com"
}
```

This will add the user to your ActiveCampaign list and assign them a tag securely.

## Example Usage

See the [NewsletterSignup component](https://github.com/thecityny/2025-meet-your-mayor/blob/main/src/components/NewsletterSignup.tsx) inside the [Meet Your Mayor 2025 codebase](https://github.com/thecityny/2025-meet-your-mayor/tree/main) for an example of how we use this API proxy in production. 
