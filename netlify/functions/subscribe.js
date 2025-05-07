const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { email } = JSON.parse(event.body);

  if (!email) {
    return {
      statusCode: 400,
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
          listid: [LIST_ID],
          status: 1,
        },
      }),
    });

    const syncData = await syncResponse.json();

    if (!syncData.contact || !syncData.contact.id) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to sync contact",
          details: syncData,
        }),
      };
    }

    const contactId = syncData.contact.id;

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

    const tagData = await tagResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        contact: syncData.contact,
        tag: tagData.contactTag,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Request failed", details: err.message }),
    };
  }
};
