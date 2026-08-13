export function shouldBlockForApplicationData(pathname: string) {
  return pathname !== "/settings";
}
