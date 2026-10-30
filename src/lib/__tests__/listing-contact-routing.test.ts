import test from "node:test";
import assert from "node:assert/strict";
import { buildTelUrl } from "@/lib/leads/call-routing";
import {
  buildListingWhatsAppInquiryMessage,
  listingContactContextFromListing,
} from "@/lib/marketplace/listing-inquiry-message";
import {
  resolveSampleFixtureContactLead,
  resolveSampleFixturePhoneReveal,
} from "@/lib/sample-listings/contact-routing";
import { getSampleListingBySlugOrId } from "@/lib/sample-listings/query-fixtures";

const prevFixture = process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;

test.before(() => {
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
});

test.after(() => {
  if (prevFixture === undefined) delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  else process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = prevFixture;
});

test("buildTelUrl encodes Nigerian numbers without corrupting digits", () => {
  const url = buildTelUrl("+234 803 123 4567");
  assert.match(url, /^tel:/);
  assert.match(url, /2348031234567/);
});

test("sample fixture WhatsApp lead includes listing title and URL", () => {
  const slug = "sample-samsung-galaxy-s24-lagos";
  const listing = getSampleListingBySlugOrId(slug);
  assert.ok(listing);
  const contact = listingContactContextFromListing(listing!, "ELECTRONICS");
  const lead = resolveSampleFixtureContactLead({
    listingId: listing!.id,
    agentId: listing!.agent_id,
    leadType: "whatsapp",
    assetType: "ELECTRONICS",
    contact,
  });
  assert.ok(lead?.ok);
  assert.match(lead!.redirectUrl, /^https:\/\/wa\.me\//);
  const message = buildListingWhatsAppInquiryMessage("ELECTRONICS", contact);
  assert.match(message, /Samsung|Galaxy|Yike/i);
  assert.match(message, /yike\.ng|localhost/i);
});

test("sample fixture call lead returns tel URL", () => {
  const slug = "sample-toyota-camry-2019-lagos";
  const listing = getSampleListingBySlugOrId(slug);
  assert.ok(listing);
  const contact = listingContactContextFromListing(listing!, "VEHICLE");
  const lead = resolveSampleFixtureContactLead({
    listingId: listing!.id,
    agentId: listing!.agent_id,
    leadType: "call",
    assetType: "VEHICLE",
    contact,
  });
  assert.ok(lead?.callAllowed);
  assert.match(lead!.redirectUrl, /^tel:/);
});

test("sample phone reveal matches seller on listing", () => {
  const slug = "sample-duplex-sale-abuja-maitama";
  const listing = getSampleListingBySlugOrId(slug);
  assert.ok(listing);
  const reveal = resolveSampleFixturePhoneReveal({
    listingId: listing!.id,
    sellerId: listing!.agent_id,
  });
  assert.ok(reveal?.telUrl);
  assert.match(reveal!.telUrl, /^tel:/);
});

test("sample lead rejects mismatched agent", () => {
  const listing = getSampleListingBySlugOrId("sample-samsung-galaxy-s24-lagos");
  assert.ok(listing);
  const contact = listingContactContextFromListing(listing!, "ELECTRONICS");
  const lead = resolveSampleFixtureContactLead({
    listingId: listing!.id,
    agentId: "00000000-0000-0000-0000-000000000000",
    leadType: "whatsapp",
    assetType: "ELECTRONICS",
    contact,
  });
  assert.equal(lead, null);
});
