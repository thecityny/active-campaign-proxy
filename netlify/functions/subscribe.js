const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const allowedOrigins = [
  "https://www.thecity.nyc",
  "https://thecity.nyc",
  "https://qa-projects.thecity.nyc",
  "https://projects.thecity.nyc",
];

exports.handler = async function (event, context) {
  const origin = event.headers.origin;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Handle POST request for subscribing the user
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { email, quizResults } = JSON.parse(event.body);

  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing email" }),
    };
  }

  const API_URL = process.env.ACTIVE_CAMPAIGN_URL;
  const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
  const LIST_ID = process.env.ACTIVE_CAMPAIGN_LIST_ID;
  const TAG_ID = process.env.ACTIVE_CAMPAIGN_TAG_ID;

  try {
    const syncResponse = await fetch(`${API_URL}/api/3/contact/sync`, {
      method: "POST",
      headers: {
        "Api-Token": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contact: {
          email,
          status: 1,
        },
      }),
    });

    const syncData = await syncResponse.json();

    if (!syncData.contact || !syncData.contact.id) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to sync contact",
          details: syncData,
        }),
      };
    }

    const contactId = syncData.contact.id;

    const listResponse = await fetch(`${API_URL}/api/3/contactLists`, {
      method: "POST",
      headers: {
        "Api-Token": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactList: {
          contact: contactId,
          list: LIST_ID,
          status: 1,
        },
      }),
    });

    const tagResponse = await fetch(`${API_URL}/api/3/contactTags`, {
      method: "POST",
      headers: {
        "Api-Token": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactTag: {
          contact: contactId,
          tag: TAG_ID,
        },
      }),
    });

    const listData = await listResponse.json();
    const tagData = await tagResponse.json();

    let fieldResultsResponse, fieldDateResponse;

    if (quizResults) {
      // 1. Save quiz results
      const quizRes = await fetch(`${API_URL}/api/3/fieldValues`, {
        method: "POST",
        headers: {
          "Api-Token": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldValue: {
            contact: contactId,
            field: "90", // quizResults field ID
            value: quizResults,
          },
        }),
      });

      fieldResultsResponse = await quizRes.json();

      // 2. Save quiz submission timestamp
      const dateRes = await fetch(`${API_URL}/api/3/fieldValues`, {
        method: "POST",
        headers: {
          "Api-Token": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldValue: {
            contact: contactId,
            field: "91", // submission date field ID
            value: new Date().toISOString(),
          },
        }),
      });

      fieldDateResponse = await dateRes.json();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        contact: syncData.contact,
        list: listData.contactList,
        tag: tagData.contactTag,
        quizResultsField: fieldResultsResponse,
        quizSubmittedAtField: fieldDateResponse,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Request failed", details: err.message }),
    };
  }
};
