declare namespace App {
  interface Locals {
    isAdmin: boolean;
    /** True when the coming soon page is on and this signed-in admin is seeing the real site instead */
    comingSoonPreview: boolean;
  }
}
