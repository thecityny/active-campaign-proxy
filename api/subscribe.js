export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  const API_URL = process.env.ACTIVE_CAMPAIGN_URL;
  const API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;
  const LIST_ID = process.env.ACTIVE_CAMPAIGN_LIST_ID;
  const TAG_ID = process.env.ACTIVE_CAMPAIGN_TAG_ID;

  try {
    // Step 1: Sync the contact
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
      return res
        .status(500)
        .json({ error: "Failed to sync contact", details: syncData });
    }

    const contactId = syncData.contact.id;

    // Step 2: Add tag to the contact
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

    res
      .status(syncResponse.status)
      .json({ contact: syncData.contact, tag: tagData.contactTag });
  } catch (err) {
    res.status(500).json({ error: "Request failed", details: err.message });
  }
}
