// Minimal types for Google Identity Services (https://accounts.google.com/gsi/client).
type GoogleCredentialResponse = { credential: string; select_by?: string };

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          itp_support?: boolean;
          use_fedcm_for_button?: boolean;
        }): void;
        renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
        disableAutoSelect(): void;
      };
    };
  };
}
