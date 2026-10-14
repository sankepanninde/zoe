import type { Preview } from "@storybook/react-vite";
import "../kit.css";
import "../dashboard.css";
import "../roles.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: "error" },
  },
  globalTypes: {
    tema: {
      description: "Tema de color",
      defaultValue: "oscuro",
      toolbar: { title: "Tema", items: ["oscuro", "claro"], dynamicTitle: true },
    },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute(
        "data-theme",
        context.globals.tema === "claro" ? "light" : "dark"
      );
      return <Story />;
    },
  ],
};

export default preview;
