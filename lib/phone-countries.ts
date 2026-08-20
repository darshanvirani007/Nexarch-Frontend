import examples from "libphonenumber-js/mobile/examples";
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/mobile";

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export const phoneCountries = getCountries()
  .map((code) => {
    const name = displayNames.of(code) || code;
    const dialCode = `+${getCountryCallingCode(code)}`;
    const example = getExampleNumber(code, examples);
    return {
      code,
      name,
      dialCode,
      placeholder: example?.formatInternational() || dialCode,
      label: `${name} (${dialCode})`,
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

const countryByName = new Map(phoneCountries.map((country) => [country.name, country]));
const countryByCode = new Map(phoneCountries.map((country) => [country.code, country]));

export function getPhoneCountry(countryName: string) {
  return countryByName.get(countryName);
}

export function getPhoneCountryByCode(countryCode: string) {
  return countryByCode.get(countryCode.toUpperCase() as CountryCode);
}

export function validatePhoneForCountry(value: string, countryName: string) {
  const country = getPhoneCountry(countryName);
  if (!country) return false;

  const parsed = parsePhoneNumberFromString(value, country.code as CountryCode);
  const numberType = parsed?.getType();
  return Boolean(
    parsed?.isValid()
    && parsed.country === country.code
    && (numberType === "MOBILE" || numberType === "FIXED_LINE_OR_MOBILE"),
  );
}

export function normalizePhoneForCountry(value: string, countryName: string) {
  const country = getPhoneCountry(countryName);
  if (!country) return value.trim();
  return parsePhoneNumberFromString(value, country.code as CountryCode)?.number || value.trim();
}
