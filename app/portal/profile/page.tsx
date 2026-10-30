
"use client";

import { useState } from "react";

interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

const initialProfile: CustomerProfile = {
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@example.com",
  phone: "403-555-0123",
  company: "Smith Construction",
  address: "123 Example Street",
  city: "Calgary",
  province: "Alberta",
  postalCode: "T2P 1A1",
};

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<CustomerProfile>(initialProfile);

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setErrors([]);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors: string[] = [];

    if (!profile.firstName.trim()) {
      validationErrors.push("First name is required.");
    }

    if (!profile.lastName.trim()) {
      validationErrors.push("Last name is required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      validationErrors.push("Enter a valid email address.");
    }

    if (!profile.phone.trim()) {
      validationErrors.push("Phone number is required.");
    }

    if (!profile.address.trim()) {
      validationErrors.push("Street address is required.");
    }

    if (!profile.city.trim()) {
      validationErrors.push("City is required.");
    }

    if (!profile.postalCode.trim()) {
      validationErrors.push("Postal code is required.");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setMessage("");
      return;
    }

    setErrors([]);
    setMessage("Profile changes saved successfully.");
    setIsEditing(false);
  }

  function handleCancel() {
    setProfile(initialProfile);
    setErrors([]);
    setMessage("");
    setIsEditing(false);
  }

  function updateField(
    name: keyof CustomerProfile,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 disabled:text-gray-600";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your contact and delivery information.
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setProfile(initialProfile);
                setIsEditing(true);
                setMessage("");
                setErrors([]);
              }}
              className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        {errors.length > 0 && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <p className="mb-2 font-semibold">
              Please correct the following:
            </p>
            <ul className="list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSave} noValidate>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your name and contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="company" className="text-sm font-medium text-gray-700">
                  Company Name (Optional)
                </label>
                <input
                  id="company"
                  name="company"
                  value={profile.company}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="border-y border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Delivery Address
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                The address associated with your customer profile.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="city" className="text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="province" className="text-sm font-medium text-gray-700">
                  Province
                </label>
                <input
                  id="province"
                  name="province"
                  value={profile.province}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  value={profile.postalCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          Demo profile: connect this form to the authenticated customer
          account before using it with real customer information.
        </p>
      </div>
    </div>
  );
}
