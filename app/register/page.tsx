"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  Mail,
  Lock,
  X,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { setStoredOrganizationId } from "@/lib/organization-storage";
import { createClient } from "@/lib/supabase/client";
import {
  API_CURRENCY_OPTIONS,
  DEFAULT_PURCHASE_CURRENCY,
  DEFAULT_SALE_CURRENCY,
  type ApiCurrencyCode,
} from "@/lib/currencies";
const CATEGORY_LABELS: Record<string, string> = {
  sales: "Vente (commerce)",
  delivery: "Livraison / logistique",
};

const COUNTRY_OPTIONS = [
  { code: "BJ", label: "Bénin" },
  { code: "TG", label: "Togo" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
];

const LOCALE_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "zh", label: "中文" },
] as const;

const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function normalizeCountries(countries: string[]): string[] {
  return Array.from(
    new Set(
      countries
        .map((country) => country.trim().toUpperCase())
        .filter((country) => /^[A-Z]{2}$/.test(country))
    )
  );
}

function validateStep1(data: {
  shopName: string;
  category: string;
  countries: string[];
}): string | null {
  if (!data.shopName.trim()) return "Indiquez le nom de la boutique.";
  if (normalizeCountries(data.countries).length === 0) {
    return "Choisissez au moins un pays de presence.";
  }
  if (!data.category) return "Choisissez une catégorie.";
  return null;
}

function validateStep2(data: { email: string; password: string; username: string }): string | null {
  if (!data.email.trim()) return "Indiquez votre e-mail.";
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
  if (!emailOk) return "E-mail invalide.";
  if (data.username.trim() && !/^[a-zA-Z0-9._-]{3,32}$/.test(data.username.trim())) {
    return "Le username doit contenir 3 a 32 caracteres : lettres, chiffres, point, tiret ou underscore.";
  }
  if (data.password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (data.password.length > 128) return "Le mot de passe ne peut pas dépasser 128 caractères.";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orgImageInputRef = useRef<HTMLInputElement>(null);
  const memberImageInputRef = useRef<HTMLInputElement>(null);
  const [organizationProfileFile, setOrganizationProfileFile] = useState<File | null>(null);
  const [organizationProfilePreview, setOrganizationProfilePreview] = useState<string | null>(null);
  const [memberProfileFile, setMemberProfileFile] = useState<File | null>(null);
  const [memberProfilePreview, setMemberProfilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    shopName: "",
    category: "" as "" | "sales" | "delivery",
    description: "",
    countries: ["BJ"],
    purchaseCurrency: DEFAULT_PURCHASE_CURRENCY,
    saleCurrency: DEFAULT_SALE_CURRENCY,
    firstName: "",
    lastName: "",
    username: "",
    locale: "fr",
    email: "",
    password: "",
  });

  useEffect(() => {
    return () => {
      if (organizationProfilePreview) URL.revokeObjectURL(organizationProfilePreview);
    };
  }, [organizationProfilePreview]);

  useEffect(() => {
    return () => {
      if (memberProfilePreview) URL.revokeObjectURL(memberProfilePreview);
    };
  }, [memberProfilePreview]);

  const updateForm = (field: string, value: string | string[]) => {
    setStepError(null);
    setSubmitError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCountry = (country: string) => {
    setStepError(null);
    setSubmitError(null);
    setFormData((prev) => {
      const current = new Set(prev.countries);
      if (current.has(country)) {
        current.delete(country);
      } else {
        current.add(country);
      }
      return { ...prev, countries: Array.from(current) };
    });
  };

  const pickOrganizationProfileImage = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (!PROFILE_IMAGE_TYPES.has(file.type)) {
      setStepError("Format image non accepte. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setStepError("Image trop lourde : maximum 5 MB.");
      return;
    }
    setStepError(null);
    setSubmitError(null);
    if (organizationProfilePreview) URL.revokeObjectURL(organizationProfilePreview);
    setOrganizationProfileFile(file);
    setOrganizationProfilePreview(URL.createObjectURL(file));
    if (orgImageInputRef.current) orgImageInputRef.current.value = "";
  };

  const pickMemberProfileImage = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (!PROFILE_IMAGE_TYPES.has(file.type)) {
      setStepError("Format image non accepte. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setStepError("Image trop lourde : maximum 5 MB.");
      return;
    }
    setStepError(null);
    setSubmitError(null);
    if (memberProfilePreview) URL.revokeObjectURL(memberProfilePreview);
    setMemberProfileFile(file);
    setMemberProfilePreview(URL.createObjectURL(file));
    if (memberImageInputRef.current) memberImageInputRef.current.value = "";
  };

  async function uploadAvatarImage(file: File, path: string): Promise<string> {
    const supabase = createClient();
    const objectPath = path.replace(/^\/+/, "").replace(/^avatars\/+/i, "");
    const { error } = await supabase.storage.from("avatars").upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (error) throw new Error(error.message);
    return objectPath;
  }

  async function uploadMemberProfileImage(userId: string): Promise<string | null> {
    if (!memberProfileFile) return null;
    const ext = memberProfileFile.name.includes(".")
      ? memberProfileFile.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
    const path = `${userId}/profile_${Date.now()}.${safeExt}`;
    return uploadAvatarImage(memberProfileFile, path);
  }

  async function uploadOrganizationProfileImage(organizationId: string): Promise<string | null> {
    if (!organizationProfileFile) return null;
    const ext = organizationProfileFile.name.includes(".")
      ? organizationProfileFile.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
    const path = `organizations/${organizationId}/profile_${Date.now()}.${safeExt}`;
    return uploadAvatarImage(organizationProfileFile, path);
  }

  async function patchMemberProfile(profilePicture: string | null) {
    if (!profilePicture && !formData.firstName.trim() && !formData.lastName.trim() && !formData.username.trim()) {
      return;
    }
    const {
      data: { session },
    } = await createClient().auth.getSession();
    if (!session?.access_token) return;
    await fetch("/api/members/me/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: formData.firstName.trim() || null,
        last_name: formData.lastName.trim() || null,
        username: formData.username.trim() || null,
        profile_picture: profilePicture,
      }),
    });
  }

  async function patchOrganizationProfile(organizationId: string, profilePicture: string | null) {
    if (!profilePicture) return;
    const {
      data: { session },
    } = await createClient().auth.getSession();
    if (!session?.access_token) return;
    await fetch(`/api/organizations/${organizationId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile_picture: profilePicture,
        countries: normalizeCountries(formData.countries),
      }),
    });
  }

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1(formData);
      if (err) {
        setStepError(err);
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2(formData);
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStepError(null);
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setStepError(null);
    setSubmitError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const err1 = validateStep1(formData);
    const err2 = validateStep2(formData);
    if (err1 || err2) {
      setStepError(err1 || err2);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      organization_name: formData.shopName.trim(),
      organization_category: formData.category as "sales" | "delivery",
      organization_description: formData.description.trim() || null,
      organization_profile_picture: null,
      organization_countries: normalizeCountries(formData.countries),
      organization_default_currencies: {
        purchase: formData.purchaseCurrency,
        sale: formData.saleCurrency,
      },
      member_first_name: formData.firstName.trim() || null,
      member_last_name: formData.lastName.trim() || null,
      member_username: formData.username.trim() || null,
      member_profile_picture: null,
      member_locale: formData.locale,
      email: formData.email.trim(),
      password: formData.password,
    };

    try {
      const res = await fetch("/api/register-member-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string; organization_id?: string };

      if (!res.ok) {
        setSubmitError(
          typeof data.error === "string" ? data.error : "Inscription impossible. Réessayez."
        );
        return;
      }

      if (typeof data.organization_id === "string" && data.organization_id) {
        setStoredOrganizationId(data.organization_id);
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (signInError) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push("/login?registered=1");
        }, 2500);
        return;
      }

      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
      if (userId) {
        try {
          const memberProfilePicture = await uploadMemberProfileImage(userId);
          await patchMemberProfile(memberProfilePicture);
        } catch {
          /* Le compte est cree et connecte ; le profil pourra etre complete plus tard. */
        }
      }
      if (data.organization_id) {
        try {
          const organizationProfilePicture = await uploadOrganizationProfileImage(data.organization_id);
          await patchOrganizationProfile(data.organization_id, organizationProfilePicture);
        } catch {
          /* Le compte est cree et connecte ; l'image organisation pourra etre completee plus tard. */
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/dashboard");
      }, 2500);
    } catch (networkErr) {
      setSubmitError(
        networkErr instanceof Error ? networkErr.message : "Erreur réseau. Vérifiez votre connexion."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabel =
    formData.category && CATEGORY_LABELS[formData.category]
      ? CATEGORY_LABELS[formData.category]
      : formData.category || "—";
  const localeLabel =
    LOCALE_OPTIONS.find((locale) => locale.code === formData.locale)?.label ?? formData.locale;
  const purchaseCurrencyLabel =
    API_CURRENCY_OPTIONS.find((currency) => currency.code === formData.purchaseCurrency)?.label ??
    formData.purchaseCurrency;
  const saleCurrencyLabel =
    API_CURRENCY_OPTIONS.find((currency) => currency.code === formData.saleCurrency)?.label ??
    formData.saleCurrency;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] items-center py-16 px-4">
      {/* Header */}
      <div className="text-center mb-10 w-full max-w-2xl">
        <h1 className="text-3xl font-extrabold text-[#3730A3] tracking-tight mb-2">Indigo Marketplace</h1>
        <p className="text-gray-600">Create your merchant account in minutes</p>

        {/* Progress Tracker */}
        <div className="max-w-xl mx-auto mt-12 relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200">
            <div
              className="h-full bg-[#3730A3] transition-all duration-300"
              style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
            ></div>
          </div>
          <div className="flex justify-between relative z-10">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mb-3 transition-colors ${step >= 1 ? "bg-[#3730A3] text-white" : "bg-white border-2 border-gray-200 text-gray-400"}`}
              >
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${step >= 1 ? "text-[#3730A3]" : "text-gray-400"}`}
              >
                Shop Details
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mb-3 transition-colors ${step > 2 ? "bg-[#3730A3] text-white" : step === 2 ? "bg-white border-2 border-[#3730A3] text-[#3730A3]" : "bg-white border-2 border-gray-200 text-gray-400"}`}
              >
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
              </div>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${step >= 2 ? (step > 2 ? "text-[#3730A3]" : "text-gray-900") : "text-gray-400"}`}
              >
                Account Info
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mb-3 transition-colors ${step === 3 ? "bg-white border-2 border-[#3730A3] text-[#3730A3]" : "bg-white border-2 border-gray-200 text-gray-400"}`}
              >
                3
              </div>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${step === 3 ? "text-gray-900" : "text-gray-400"}`}
              >
                Verification
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-3xl border border-gray-100 p-10 flex flex-col md:flex-row gap-12 min-h-[500px]">
        <div className="w-full md:w-[240px] flex-shrink-0">
          {step === 1 && (
            <>
              <input
                ref={orgImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pickOrganizationProfileImage(e.target.files)}
              />
              <button
                type="button"
                onClick={() => orgImageInputRef.current?.click()}
                className="group mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 bg-cover bg-center text-left transition hover:border-indigo-300"
                style={
                  organizationProfilePreview
                    ? { backgroundImage: `url(${organizationProfilePreview})` }
                    : {
                        backgroundImage:
                          "url('https://images.unsplash.com/photo-1542456041-9fbcd8a64966?fit=crop&w=500&h=500')",
                      }
                }
              >
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black/25 p-4 text-center text-white transition group-hover:bg-black/35">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs font-bold">
                    {organizationProfilePreview ? "Changer l'image" : "Ajouter l'image de profil"}
                  </span>
                </span>
              </button>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Shop Presence</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your shop name and category will help customers find your unique offerings in our marketplace atrium.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <input
                ref={memberImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pickMemberProfileImage(e.target.files)}
              />
              <button
                type="button"
                onClick={() => memberImageInputRef.current?.click()}
                className="group mb-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 bg-cover bg-center text-left transition hover:border-indigo-300"
                style={
                  memberProfilePreview
                    ? { backgroundImage: `url(${memberProfilePreview})` }
                    : {
                        backgroundImage:
                          "url('https://images.unsplash.com/photo-1614064641913-a53b15c90ecb?fit=crop&w=500&h=500')",
                      }
                }
              >
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-indigo-950/25 p-4 text-center text-white transition group-hover:bg-indigo-950/35">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs font-bold">
                    {memberProfilePreview ? "Changer la photo" : "Ajouter votre photo"}
                  </span>
                </span>
              </button>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Merchant Security</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Set up your personal access credentials to securely manage your marketplace dashboard.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <div className="w-full aspect-square bg-indigo-50 rounded-2xl mb-6 flex items-center justify-center text-indigo-400 border border-indigo-100">
                <CheckCircle className="w-24 h-24 opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Launch</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Review your business identity and security credentials before finalizing your storefront.
              </p>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {step === 1 && (
            <div className="flex-col flex flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your shop</h2>
              <p className="text-sm text-gray-500 mb-8">Provide your business identity to get started.</p>

              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Shop Name</label>
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => updateForm("shopName", e.target.value)}
                    placeholder="e.g. Blue Velvet Vintage"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Business Category</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => updateForm("category", e.target.value)}
                      className="appearance-none w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      <option value="sales">Vente (commerce)</option>
                      <option value="delivery">Livraison / logistique</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Pays de présence
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRY_OPTIONS.map((country) => {
                      const checked = formData.countries.includes(country.code);
                      return (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => toggleCountry(country.code)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            checked
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                          }`}
                        >
                          {country.code} · {country.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Devise des achats
                    </label>
                    <div className="relative">
                      <select
                        value={formData.purchaseCurrency}
                        onChange={(e) =>
                          updateForm("purchaseCurrency", e.target.value as ApiCurrencyCode)
                        }
                        className="appearance-none w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        {API_CURRENCY_OPTIONS.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">Commandes fournisseur</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Devise des ventes
                    </label>
                    <div className="relative">
                      <select
                        value={formData.saleCurrency}
                        onChange={(e) =>
                          updateForm("saleCurrency", e.target.value as ApiCurrencyCode)
                        }
                        className="appearance-none w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        {API_CURRENCY_OPTIONS.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">Articles et ventes client</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 flex justify-between">
                    Brief Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="Describe what makes your shop special..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                  ></textarea>
                </div>

              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-col flex flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set up your account</h2>
              <p className="text-sm text-gray-500 mb-8">
                Use your professional email to handle your merchant account.
              </p>

              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateForm("firstName", e.target.value)}
                      placeholder="Ada"
                      autoComplete="given-name"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateForm("lastName", e.target.value)}
                      placeholder="Lovelace"
                      autoComplete="family-name"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 flex justify-between">
                      Username <span className="text-gray-400 font-normal">(Optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateForm("username", e.target.value)}
                      placeholder="ada_shop"
                      autoComplete="username"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Langue</label>
                    <div className="relative">
                      <select
                        value={formData.locale}
                        onChange={(e) => updateForm("locale", e.target.value)}
                        className="appearance-none w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        {LOCALE_OPTIONS.map((locale) => (
                          <option key={locale.code} value={locale.code}>
                            {locale.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">8 à 128 caractères</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-col flex flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-sm text-gray-500 mb-8">
                Please verify your information before we create your account.
              </p>

              <div className="space-y-6 flex-1">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-4">Shop Details</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500">Shop Name</div>
                    <div className="font-semibold text-gray-900 text-right">{formData.shopName || "—"}</div>

                    <div className="text-gray-500">Category</div>
                    <div className="font-semibold text-gray-900 text-right">{categoryLabel}</div>

                    <div className="text-gray-500">Pays</div>
                    <div className="font-semibold text-gray-900 text-right">
                      {normalizeCountries(formData.countries).join(", ") || "—"}
                    </div>

                    <div className="text-gray-500">Devise achats</div>
                    <div className="font-semibold text-gray-900 text-right">
                      {purchaseCurrencyLabel}
                    </div>

                    <div className="text-gray-500">Devise ventes</div>
                    <div className="font-semibold text-gray-900 text-right">
                      {saleCurrencyLabel}
                    </div>

                    <div className="text-gray-500">Photo organisation</div>
                    <div className="flex justify-end">
                      {organizationProfilePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={organizationProfilePreview}
                          alt=""
                          className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">—</span>
                      )}
                    </div>

                    <div className="text-gray-500 col-span-2">Description</div>
                    <div className="font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-100 col-span-2 mt-1 italic">
                      {formData.description || "No description provided."}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-4">Account Info</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500">Nom membre</div>
                    <div className="font-semibold text-gray-900 text-right">
                      {[formData.firstName, formData.lastName].filter(Boolean).join(" ") || "â€”"}
                    </div>

                    <div className="text-gray-500">Username</div>
                    <div className="text-right font-semibold text-gray-900">
                      {formData.username || "Généré automatiquement"}
                    </div>

                    <div className="text-gray-500">Langue</div>
                    <div className="font-semibold text-gray-900 text-right">{localeLabel}</div>

                    <div className="text-gray-500">Photo membre</div>
                    <div className="flex justify-end">
                      {memberProfilePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={memberProfilePreview}
                          alt=""
                          className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">—</span>
                      )}
                    </div>

                    <div className="text-gray-500">Email Address</div>
                    <div className="font-semibold text-gray-900 text-right">{formData.email || "—"}</div>

                    <div className="text-gray-500">Password</div>
                    <div className="font-semibold text-gray-900 text-right tracking-widest">••••••••</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(stepError || submitError) && (
            <div
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              {submitError || stepError}
            </div>
          )}

          <div className="flex items-center justify-between pt-8 mt-auto border-t border-gray-50">
            {step === 1 ? (
              <Link
                href="/"
                className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={prevStep}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#3730A3] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-full transition shadow-sm"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitForm}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-full transition shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    Submit &amp; Create <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#3730A3] hover:underline">
          Sign In
        </Link>
      </div>

      <div className="mt-10 flex gap-6 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        <Link href="#" className="hover:text-gray-600">
          Privacy Policy
        </Link>
        <Link href="#" className="hover:text-gray-600">
          Terms of Service
        </Link>
        <Link href="#" className="hover:text-gray-600">
          Help Center
        </Link>
      </div>

      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white border-l-4 border-emerald-500 rounded-xl shadow-2xl p-4 flex gap-4 items-start w-80">
            <div className="text-emerald-500 mt-0.5 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Compte créé avec succès !</h4>
              <p className="text-xs text-gray-500">
                Nous ouvrons votre session marchand. Redirection vers le dashboard.
                <span className="hidden">
                page de connexion…
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
