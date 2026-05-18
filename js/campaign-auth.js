let activeCampaign = null;
let activeSession = null;
let campaignBootstrapPromise = null;

function getCampaignAuthGate() {
  return document.getElementById("campaign-auth-gate");
}

function setCampaignAuthStatus(message = "") {
  const status = document.getElementById("campaign-auth-status");
  if (status) {
    status.textContent = message;
  }
}

function setCampaignAuthBusy(isBusy) {
  const submit = document.getElementById("campaign-auth-submit");
  if (submit) {
    submit.disabled = isBusy;
  }
}

function showCampaignAuthGate() {
  getCampaignAuthGate()?.classList.remove("hidden");
}

function hideCampaignAuthGate() {
  getCampaignAuthGate()?.classList.add("hidden");
}

async function fetchAvailableCampaigns() {
  const { data, error } = await campaignSupabase
    .from("campaigns")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function bootstrapCampaignSession() {
  if (campaignBootstrapPromise) return campaignBootstrapPromise;

  campaignBootstrapPromise = (async () => {
    const { data, error } = await campaignSupabase.auth.getSession();
    if (error) throw error;

    activeSession = data.session || null;

    if (!activeSession) {
      showCampaignAuthGate();
      return null;
    }

    const campaigns = await fetchAvailableCampaigns();

    if (!campaigns.length) {
      showCampaignAuthGate();
      setCampaignAuthStatus("No campaigns are available for this account.");
      return null;
    }

    activeCampaign = campaigns[0];
    hideCampaignAuthGate();
    return activeCampaign;
  })();

  try {
    return await campaignBootstrapPromise;
  } finally {
    campaignBootstrapPromise = null;
  }
}

async function handleCampaignAuthSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("campaign-auth-email")?.value.trim();
  const password = document.getElementById("campaign-auth-password")?.value;

  if (!email || !password) return;

  setCampaignAuthBusy(true);
  setCampaignAuthStatus("Signing in...");

  try {
    const { error } = await campaignSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const campaign = await bootstrapCampaignSession();
    if (campaign) {
      setCampaignAuthStatus("");
      window.dispatchEvent(new CustomEvent("campaign-authenticated", {
        detail: { campaign }
      }));
    }
  } catch (error) {
    console.error("Campaign sign-in failed:", error);
    setCampaignAuthStatus(error.message || "Unable to sign in.");
  } finally {
    setCampaignAuthBusy(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("campaign-auth-form")
    ?.addEventListener("submit", handleCampaignAuthSubmit);
});

window.getActiveCampaign = () => activeCampaign;
window.bootstrapCampaignSession = bootstrapCampaignSession;
