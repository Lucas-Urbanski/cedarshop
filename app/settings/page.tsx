"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/themeProvider";
import { LogoutButton } from "@/components/auth/logoutButton";
import Navbar from "@/components/navBar";
import { auth, db } from "@/utils/firebase";
import type { CustomerProfile, UserProfile, UserRole } from "@/types/types";

const emptyProfile: CustomerProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
};

const userRoles: Record<string, UserRole> = {
  customer: "Customer",
  driver: "Driver",
  floorstaff: "FloorStaff",
  salesstaff: "SalesStaff",
  administrator: "Administrator",
};

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function profileFromData(data: Record<string, unknown>): CustomerProfile {
  const nameParts = readString(data.fullName).trim().split(/\s+/).filter(Boolean);
  const address =
    typeof data.shippingAddress === "object" && data.shippingAddress !== null
      ? (data.shippingAddress as Record<string, unknown>)
      : {};

  return {
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    phone: readString(data.phone),
    company: readString(data.company),
    address: readString(address.street),
    city: readString(address.city),
    province: readString(address.province),
    postalCode: readString(address.postalCode),
  };
}

function profileName(profile: CustomerProfile): string {
  return `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<CustomerProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    let isCurrent = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isCurrent) return;

      setAuthUser(firebaseUser);
      setIsLoading(true);
      setProfileError(null);
      setProfileMessage(null);

      if (!firebaseUser) {
        setUser(null);
        setProfile(emptyProfile);
        setSavedProfile(emptyProfile);
        setIsLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!snapshot.exists()) {
          throw new Error("Your account profile could not be found.");
        }

        const data = snapshot.data();
        const role =
          typeof data.role === "string"
            ? userRoles[data.role.toLowerCase().replace(/\s+/g, "")]
            : undefined;
        if (!role) {
          throw new Error("Your account role could not be recognized.");
        }

        const loadedProfile = profileFromData(data);
        if (isCurrent) {
          setProfile(loadedProfile);
          setSavedProfile(loadedProfile);
          setUser({
            name:
              readString(data.fullName) ||
              firebaseUser.displayName ||
              firebaseUser.email ||
              "Customer",
            email: firebaseUser.email ?? "",
            role,
          });
        }
      } catch (error: unknown) {
        if (isCurrent) {
          setUser(null);
          setProfileError(errorMessage(error));
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setProfileError(null);
    setProfileMessage(null);
  }

  function handleCancel() {
    setProfile(savedProfile);
    setIsEditing(false);
    setProfileError(null);
    setProfileMessage(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser) {
      setProfileError("Sign in to update your profile.");
      return;
    }

    const validationErrors: string[] = [];
    if (!profile.firstName.trim()) validationErrors.push("First name is required.");
    if (!profile.lastName.trim()) validationErrors.push("Last name is required.");
    if (!profile.phone.trim()) validationErrors.push("Phone number is required.");
    if (!profile.address.trim()) validationErrors.push("Street address is required.");
    if (!profile.city.trim()) validationErrors.push("City is required.");
    if (!profile.postalCode.trim()) validationErrors.push("Postal code is required.");

    if (validationErrors.length > 0) {
      setProfileError(validationErrors.join(" "));
      setProfileMessage(null);
      return;
    }

    const fullName = profileName(profile);
    setIsSaving(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      await updateDoc(doc(db, "users", authUser.uid), {
        fullName,
        phone: profile.phone.trim(),
        company: profile.company.trim(),
        "shippingAddress.street": profile.address.trim(),
        "shippingAddress.city": profile.city.trim(),
        "shippingAddress.province": profile.province.trim(),
        "shippingAddress.postalCode": profile.postalCode.trim(),
      });

      const updatedProfile = {
        ...profile,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim(),
        company: profile.company.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
        province: profile.province.trim(),
        postalCode: profile.postalCode.trim(),
      };
      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setUser((current) =>
        current ? { ...current, name: fullName } : current,
      );
      setIsEditing(false);
      setProfileMessage("Profile saved.");
    } catch (error: unknown) {
      setProfileError(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const inputClassName = `profileInput${isEditing ? "" : " profileInputDisabled"}`;

  return (
    <div className="appShell">
      <Navbar user={user} />

      <main className="settingsMain">
        <div className="settingsHeading">
          <p className="eyebrow">Preferences</p>
          <h1>Settings</h1>
        </div>

        <section className="settingsPanel" aria-labelledby="appearance-heading">
          <div className="settingsCopy">
            <div className="settingsIcon" aria-hidden="true">
              {isDark ? (
                <Moon className="iconMedium" />
              ) : (
                <Sun className="iconMedium" />
              )}
            </div>
            <div>
              <h2 id="appearance-heading">Appearance</h2>
            </div>
          </div>

          <button
            type="button"
            className={`themeSwitch${isDark ? " themeSwitchOn" : ""}`}
            role="switch"
            aria-checked={isDark}
            aria-label="Dark mode"
            onClick={toggleTheme}
          >
            <span className="themeSwitchThumb" />
          </button>
        </section>

        {authUser ? (
          <section className="settingsPanel settingsSignOutPanel">
            <div className="settingsCopy">
              <div>
                <h2>Sign out</h2>
                <p>Sign out of your Cedar Shop account on this device.</p>
              </div>
            </div>
            <LogoutButton className="profileSignOutButton" />
          </section>
        ) : null}

        <section className="profileSection" aria-labelledby="profile-heading">
          <div className="settingsHeading">
            <p className="eyebrow">Account</p>
            <h2 id="profile-heading">Profile</h2>
          </div>

          {!authUser && !isLoading ? (
            <p className="profileNotice">
              Sign in to view and edit your profile.
            </p>
          ) : null}

          {profileError ? (
            <p className="profileAlert" role="alert">
              {profileError}
            </p>
          ) : null}

          {profileMessage ? (
            <p className="profileNotice" role="status">
              {profileMessage}
            </p>
          ) : null}

          {authUser ? (
            <form className="profileForm" onSubmit={handleSave}>
              <div className="profileFormHeader">
                <div>
                  <h3>Personal information</h3>
                  <p>Your email address is managed by your sign-in provider.</p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    className="profileSecondaryButton"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading || !!profileError}
                  >
                    Edit profile
                  </button>
                )}
              </div>

              {isLoading ? (
                <p className="profileLoading" role="status">
                  Loading profile…
                </p>
              ) : (
                <>
                  <div className="profileFields">
                    <label className="profileField">
                      <span>First name</span>
                      <input
                        name="firstName"
                        autoComplete="given-name"
                        value={profile.firstName}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>

                    <label className="profileField">
                      <span>Last name</span>
                      <input
                        name="lastName"
                        autoComplete="family-name"
                        value={profile.lastName}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>

                    <label className="profileField">
                      <span>Email address</span>
                      <input
                        type="email"
                        value={authUser.email ?? ""}
                        disabled
                        className={`${inputClassName} profileInputDisabled`}
                      />
                    </label>

                    <label className="profileField">
                      <span>Phone number</span>
                      <input
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={profile.phone}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>

                    <label className="profileField profileFieldWide">
                      <span>Company name (optional)</span>
                      <input
                        name="company"
                        autoComplete="organization"
                        value={profile.company}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>
                  </div>

                  <div className="profileFormSection">
                    <h3>Delivery address</h3>
                    <p>The address associated with your customer profile.</p>
                  </div>

                  <div className="profileFields">
                    <label className="profileField profileFieldWide">
                      <span>Street address</span>
                      <input
                        name="address"
                        autoComplete="street-address"
                        value={profile.address}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>

                    <label className="profileField">
                      <span>City</span>
                      <input
                        name="city"
                        autoComplete="address-level2"
                        value={profile.city}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>

                    <label className="profileField">
                      <span>Province</span>
                      <input
                        name="province"
                        autoComplete="address-level1"
                        value={profile.province}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>

                    <label className="profileField">
                      <span>Postal code</span>
                      <input
                        name="postalCode"
                        autoComplete="postal-code"
                        value={profile.postalCode}
                        onChange={handleChange}
                        disabled={!isEditing || isSaving}
                        className={inputClassName}
                      />
                    </label>
                  </div>

                  {isEditing ? (
                    <div className="profileActions">
                      <button
                        type="button"
                        className="profileSecondaryButton"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="profilePrimaryButton"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </form>
          ) : null}
        </section>
      </main>
    </div>
  );
}
