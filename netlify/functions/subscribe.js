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
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "null",
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
  const QUIZ_RESULTS_LIST_ID = process.env.ACTIVE_CAMPAIGN_QUIZ_RESULTS_LIST_ID;
  const TAG_ID = process.env.ACTIVE_CAMPAIGN_TAG_ID;

  try {
    // Create or update the contact in ActiveCampaign
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

    let listData, tagData, fieldResultsData, fieldDateData;

    // Subscribe the contact to an ActiveCampaign list
    const listResponse = await fetch(`${API_URL}/api/3/contactLists`, {
      method: "POST",
      headers: {
        "Api-Token": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactList: {
          contact: contactId,
          list: !!quizResults ? QUIZ_RESULTS_LIST_ID : LIST_ID,
          status: 1,
        },
      }),
    });

    listData = await listResponse.json();

    // Tag the contact in ActiveCampaign
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

    tagData = await tagResponse.json();

    // If quizResults is provided, save it as a field value with the email contact, and
    // also save the timestamp of when the quiz results were requested.
    // Do not subscribe the user to a list or tag them if quizResults is provided.
    if (!!quizResults) {
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

      fieldResultsData = await quizRes.json();

      // 2. Save request submission timestamp
      const dateRes = await fetch(`${API_URL}/api/3/fieldValues`, {
        method: "POST",
        headers: {
          "Api-Token": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldValue: {
            contact: contactId,
            field: "91", // "date quiz results requested" field ID
            value: new Date().toISOString(),
          },
        }),
      });

      fieldDateData = await dateRes.json();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        contact: syncData.contact,
        list: listData?.contactList,
        tag: tagData?.contactTag,
        quizResultsField: fieldResultsData?.fieldValue,
        quizSubmittedAtField: fieldDateData?.fieldValue,
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
