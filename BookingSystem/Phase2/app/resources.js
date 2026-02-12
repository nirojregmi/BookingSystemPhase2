// ===============================
// 1) DOM references
// ===============================
const actions = document.getElementById("resourceActions");
const resourceNameContainer = document.getElementById("resourceNameContainer");

// Example roles
const role = "admin"; // "reserver" | "admin"

// Will hold a reference to the Create button so we can enable/disable it
let createButton = null;
let updateButton = null;
let deleteButton = null;

// ===============================
// 2) Button creation helpers
// ===============================

const BUTTON_BASE_CLASSES =
  "w-full rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out";

const BUTTON_ENABLED_CLASSES =
  "bg-brand-primary text-white hover:bg-brand-dark/80 shadow-soft";

const BUTTON_DISABLED_CLASSES =
  "cursor-not-allowed opacity-50";

function addButton({ label, type = "button", value, classes = "" }) {
  const btn = document.createElement("button");
  btn.type = type;
  btn.textContent = label;
  btn.name = "action";
  if (value) btn.value = value;

  btn.className = `${BUTTON_BASE_CLASSES} ${classes}`.trim();

  actions.appendChild(btn);
  return btn;
}

function setButtonEnabled(btn, enabled) {
  if (!btn) return;

  btn.disabled = !enabled;

  // Keep disabled look in ONE place (here)
  btn.classList.toggle("cursor-not-allowed", !enabled);
  btn.classList.toggle("opacity-50", !enabled);

  // Optional: remove hover feel when disabled (recommended UX)
  if (!enabled) {
    btn.classList.remove("hover:bg-brand-dark/80");
  } else {
    // Only re-add if this button is supposed to have it
    // (for Create we know it is)
    if (btn.value === "create" || btn.textContent === "Create") {
      btn.classList.add("hover:bg-brand-dark/80");
    }
  }
}

function validateCreateForm() {
  // If Create button not yet created, nothing to enable/disable
  if (!createButton) return;

  // These elements exist in resources.html
  const nameEl = document.getElementById("resourceName");
  const descEl = document.getElementById("resourceDescription");

  // Price input (number)
  const priceEl = document.querySelector('#resourceForm input[type="number"]');

  // Radio group (based on your payload screenshot it is resourcePriceUnit)
  const unitChecked = document.querySelector('#resourceForm input[name="resourcePriceUnit"]:checked');

  let ok = true;

  // Name must pass your name rule
  const name = (nameEl?.value ?? "").trim();
  if (!nameEl || !isResourceNameValid(name)) ok = false;

  // Description must be meaningful
  const desc = (descEl?.value ?? "").trim();
  if (!descEl || desc.length === 0) ok = false;

  // Price must be numeric and not empty
  const priceStr = (priceEl?.value ?? "").trim();
  const priceNum = Number(priceStr);
  if (!priceEl || priceStr.length === 0 || Number.isNaN(priceNum)) ok = false;

  // Unit must be selected
  if (!unitChecked) ok = false;

  // Final: enable/disable Create button
  setButtonEnabled(createButton, ok);
}

function renderActionButtons(currentRole) {
  if (currentRole === "reserver") {
    createButton = addButton({
      label: "Create",
      type: "submit",
      classes: BUTTON_ENABLED_CLASSES,
    });
  }

  if (currentRole === "admin") {
    createButton = addButton({
      label: "Create",
      type: "submit",
      value: "create",
      classes: BUTTON_ENABLED_CLASSES,
    });

    updateButton = addButton({
      label: "Update",
      value: "update",
      classes: BUTTON_ENABLED_CLASSES,
    });

    deleteButton = addButton({
      label: "Delete",
      value: "delete",
      classes: BUTTON_ENABLED_CLASSES,
    });
  }

  // Default: Buttons are disabled until validation says it's OK
  setButtonEnabled(createButton, false);
  setButtonEnabled(updateButton, false);
  setButtonEnabled(deleteButton, false);
}

// ===============================
// 3) Input creation + validation
// ===============================
function createResourceNameInput(container) {
  const input = document.createElement("input");

  // Core attributes
  input.id = "resourceName";
  input.name = "resourceName";
  input.type = "text";
  input.placeholder = "e.g., Meeting Room A";

  // Base Tailwind styling (single source of truth)
  input.className = `
    mt-2 w-full rounded-2xl border border-black/10 bg-white
    px-4 py-3 text-sm outline-none
    focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30
    transition-all duration-200 ease-out
  `;

  container.appendChild(input);
  return input;
}

function isResourceNameValid(value) {
  const trimmed = value.trim();

  // Allowed: letters, numbers, Finnish letters, and space (based on your current regex)
  const allowedPattern = /^[a-zA-Z0-9äöåÄÖÅ ]+$/;

  const lengthValid = trimmed.length >= 5 && trimmed.length <= 30;
  const charactersValid = allowedPattern.test(trimmed);

  return lengthValid && charactersValid;
}

function setInputVisualState(input, state) {
  // Reset to neutral base state (remove only our own validation-related classes)
  input.classList.remove(
    "border-green-500",
    "bg-green-100",
    "focus:ring-green-500/30",
    "border-red-500",
    "bg-red-100",
    "focus:ring-red-500/30",
    "focus:border-brand-blue",
    "focus:ring-brand-blue/30"
  );

  // Ensure base focus style is present when neutral
  // (If we are valid/invalid, we override ring color but keep ring behavior)
  input.classList.add("focus:ring-2");

  if (state === "valid") {
    input.classList.add("border-green-500", "bg-green-100", "focus:ring-green-500/30");
  } else if (state === "invalid") {
    input.classList.add("border-red-500", "bg-red-100", "focus:ring-red-500/30");
  } else {
    // neutral: keep base border/bg; nothing else needed
  }
}

function attachResourceNameValidation(input) {
  const update = () => {
    const raw = input.value;
    if (raw.trim() === "") {
      setInputVisualState(input, "neutral");
      validateCreateForm();
      return;
    }

    const valid = isResourceNameValid(raw);

    setInputVisualState(input, valid ? "valid" : "invalid");
    validateCreateForm();
  };


  // Real-time validation
  input.addEventListener("input", update);

  // Initialize state on page load (Create disabled until valid)
  update();
}

// ===============================
// 4) Bootstrapping
// ===============================
renderActionButtons(role);

// Create + validate input

const resourceNameInput = createResourceNameInput(resourceNameContainer);

// --- Step 4: field colors (green valid, red invalid) ---
function isMeaningful(v) {
  return (v ?? "").trim().length > 0;
}

function setFieldState(el, ok) {
  el.classList.remove("field-valid", "field-invalid");
  el.classList.add(ok ? "field-valid" : "field-invalid");
}

// Resource name validation
let nameTouched = false;

function validateResourceName() {
  const ok = isMeaningful(resourceNameInput.value);
  setFieldState(resourceNameInput, ok);
  return ok;
}

resourceNameInput.addEventListener("blur", () => {
  nameTouched = true;
  validateResourceName();
});

resourceNameInput.addEventListener("input", () => {
  if (nameTouched) validateResourceName();
});

// Resource description validation
const resourceDescriptionEl = document.getElementById("resourceDescription");
let descTouched = false;

function validateResourceDescription() {
  const ok = isMeaningful(resourceDescriptionEl.value);
  setFieldState(resourceDescriptionEl, ok);
  return ok;
}

resourceDescriptionEl.addEventListener("blur", () => {
  descTouched = true;
  validateResourceDescription();
});

resourceDescriptionEl.addEventListener("input", () => {
  if (descTouched) validateResourceDescription();
});


attachResourceNameValidation(resourceNameInput);

// Run validation when other fields change too
const resourceForm = document.getElementById("resourceForm");
if (resourceForm) {
  resourceForm.addEventListener("input", validateCreateForm);
  resourceForm.addEventListener("change", validateCreateForm);
}

// Initial validate
validateCreateForm();
