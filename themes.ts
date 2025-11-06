import React from 'react';

export type Theme = {
  name: string;
  key: string;
  colors: {
    [key: string]: string;
  };
};

export const themes: Theme[] = [
  {
    name: "Purple",
    key: "dark_purple",
    colors: {
      "--bg-gradient-from": "#081226",
      "--bg-gradient-to": "#071022",
      "--text-primary": "#e6eef8",
      "--text-secondary": "#9aa6bb",
      "--accent-from": "#7c3aed",
      "--accent-to": "#4c1d95",
      "--accent-focus": "#7c3aed",
      "--card-gradient-from": "rgba(255, 255, 255, 0.02)",
      "--card-gradient-to": "rgba(255, 255, 255, 0.01)",
      "--button-bg": "rgba(255, 255, 255, 0.1)",
      "--button-hover-bg": "rgba(255, 255, 255, 0.2)",
      "--input-border": "rgba(255, 255, 255, 0.05)",
    },
  },
  {
    name: "Green",
    key: "forest_green",
    colors: {
      "--bg-gradient-from": "#052e16",
      "--bg-gradient-to": "#064e3b",
      "--text-primary": "#d1fae5",
      "--text-secondary": "#a7f3d0",
      "--accent-from": "#10b981",
      "--accent-to": "#059669",
      "--accent-focus": "#10b981",
      "--card-gradient-from": "rgba(255, 255, 255, 0.05)",
      "--card-gradient-to": "rgba(255, 255, 255, 0.02)",
      "--button-bg": "rgba(255, 255, 255, 0.1)",
      "--button-hover-bg": "rgba(255, 255, 255, 0.2)",
      "--input-border": "rgba(255, 255, 255, 0.1)",
    },
  },
  {
    name: "Light Blue",
    key: "light_blue",
    colors: {
        "--bg-gradient-from": "#f0f9ff",
        "--bg-gradient-to": "#e0f2fe",
        "--text-primary": "#0c4a6e",
        "--text-secondary": "#075985",
        "--accent-from": "#0ea5e9",
        "--accent-to": "#0284c7",
        "--accent-focus": "#0ea5e9",
        "--card-gradient-from": "rgba(255, 255, 255, 0.7)",
        "--card-gradient-to": "rgba(255, 255, 255, 0.5)",
        "--button-bg": "rgba(8, 84, 132, 0.1)",
        "--button-hover-bg": "rgba(8, 84, 132, 0.2)",
        "--input-border": "rgba(8, 84, 132, 0.1)",
    }
  },
  {
    name: "Sunset",
    key: "sunset_orange",
    colors: {
        "--bg-gradient-from": "#2d1a3a",
        "--bg-gradient-to": "#1e1b26",
        "--text-primary": "#fde68a",
        "--text-secondary": "#fca5a5",
        "--accent-from": "#f97316",
        "--accent-to": "#ea580c",
        "--accent-focus": "#f97316",
        "--card-gradient-from": "rgba(255, 255, 255, 0.03)",
        "--card-gradient-to": "rgba(255, 255, 255, 0.01)",
        "--button-bg": "rgba(255, 255, 255, 0.1)",
        "--button-hover-bg": "rgba(255, 255, 255, 0.2)",
        "--input-border": "rgba(255, 255, 255, 0.1)",
    }
  },
  {
    name: "Islamic",
    key: "islamic_green",
    colors: {
      "--bg-gradient-from": "#043927",
      "--bg-gradient-to": "#032d1f",
      "--text-primary": "#f3f4f6",
      "--text-secondary": "#9ca3af",
      "--accent-from": "#f59e0b",
      "--accent-to": "#d97706",
      "--accent-focus": "#f59e0b",
      "--card-gradient-from": "rgba(255, 255, 255, 0.03)",
      "--card-gradient-to": "rgba(255, 255, 255, 0.01)",
      "--button-bg": "rgba(245, 158, 11, 0.1)",
      "--button-hover-bg": "rgba(245, 158, 11, 0.2)",
      "--input-border": "rgba(245, 158, 11, 0.1)",
    }
  }
];