import { test, expect } from "@playwright/test";

const journeys = [
  { title: "rural farmer", age: "32", state: "Maharashtra", gender: "male", residence: "rural", occupation: "farmer", income: "90000", employment: "self_employed", bpl: "yes", farmer: "yes", landholding: "1.5", education: "secondary", student: "no", disability: "no", target: "PM-KISAN", other: "Old Age Pension", schemeId: "pm-kisan" },
  { title: "college student", age: "20", state: "Karnataka", gender: "female", residence: "urban", occupation: "student", income: "150000", employment: "not_seeking", bpl: "no", farmer: "no", education: "undergraduate", student: "yes", disability: "no", target: "PM-USP", other: "Old Age Pension", schemeId: "csss" },
  { title: "senior citizen", age: "67", state: "West Bengal", gender: "female", residence: "rural", occupation: "retired", income: "75000", employment: "retired", bpl: "yes", farmer: "no", education: "primary", student: "no", disability: "no", target: "Old Age Pension", other: "PM-KISAN", schemeId: "ignoaps" },
];

for (const journey of journeys) {
  test(journey.title + " receives distinct results with explanations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find Government Schemes Made for You" })).toBeVisible();
    await page.getByRole("link", { name: "Find My Schemes", exact: true }).last().click();

    await page.getByLabel("Age in years").fill("121");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { name: "Personal details" })).toBeVisible();
    await page.getByLabel("Age in years").fill(journey.age);
    await page.getByLabel("Gender").selectOption(journey.gender);
    await page.getByLabel("State or union territory").selectOption(journey.state);
    await page.getByLabel("Residence").selectOption(journey.residence);
    await page.getByLabel("Occupation").selectOption(journey.occupation);
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByLabel("Annual household income (INR)").fill(journey.income);
    await page.getByLabel("Employment status").selectOption(journey.employment);
    await page.getByLabel("Below Poverty Line (BPL) status").selectOption(journey.bpl);
    await page.getByLabel("Are you a farmer?").selectOption(journey.farmer);
    const land = page.getByLabel("Landholding (hectares)");
    if (journey.landholding) await land.fill(journey.landholding);
    else await expect(land).toHaveCount(0);
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByLabel("Highest education level").selectOption(journey.education);
    await page.getByLabel("Are you currently a student?").selectOption(journey.student);
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByLabel("Do you have a disability?").selectOption(journey.disability);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { name: "Review your answers" })).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByLabel("Do you have a disability?")).toHaveValue("no");
    await page.getByRole("button", { name: "Next" }).click();

    const response = page.waitForResponse(res => res.url().endsWith("/service/eligibility/check") && res.request().method() === "POST");
    await page.getByRole("button", { name: "See My Results" }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Your scheme matches" })).toBeVisible();

    const search = page.getByRole("textbox", { name: "Search results" });
    await search.fill(journey.other);
    await expect(page.getByRole("article").filter({ has: page.getByRole("heading", { name: new RegExp(journey.other, "i") }) })).toContainText("Not Eligible Based on Provided Information");
    await search.fill(journey.target);
    await page.getByLabel("Eligibility status").selectOption("likely");
    const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: new RegExp(journey.target, "i") }) });
    await expect(card).toContainText("Likely Eligible");
    await card.getByText("Why this status?").click();
    await expect(card.getByText("Met.", { exact: true }).first()).toBeVisible();
    await card.getByRole("link", { name: "Scheme details" }).click();
    await expect(page).toHaveURL(new RegExp("/schemes/" + journey.schemeId + "$"));
    await expect(page.getByRole("heading", { name: "Illustrative eligibility criteria" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Visit official reference" })).toBeVisible();
  });
}

test("explorer search, state filtering, pagination and the mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Explore schemes", exact: true }).click();
  await expect(page.getByText("34 schemes found")).toBeVisible();
  await page.getByRole("link", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 4")).toBeVisible();
  await page.getByRole("textbox", { name: "Search schemes" }).fill("post matric");
  await page.getByLabel("Category").selectOption("education");
  await page.getByLabel("State or union territory").selectOption("Maharashtra");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("heading", { name: "Maharashtra Government of India Post-Matric Scholarship" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Karnataka Post-Matric Scholarship" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("textbox", { name: "Search schemes" }).fill("qwerty no record");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("heading", { name: "No schemes on this page" })).toBeVisible();
});
