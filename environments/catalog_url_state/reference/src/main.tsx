import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { CatalogPage } from "./CatalogPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogPage />
    </BrowserRouter>
  </StrictMode>,
);
