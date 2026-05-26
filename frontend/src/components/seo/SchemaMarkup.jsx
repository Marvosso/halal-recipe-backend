import React, { useEffect } from "react";
import {
  buildIngredientPageSchemaGraph,
  serializeSchemaGraph,
} from "../../lib/seo/schema.js";

const SCRIPT_ID = "seo-schema-ld";

/**
 * JSON-LD schema injection for ingredient pages.
 * @param {{ config: object }} props
 */
function SchemaMarkup({ config }) {
  useEffect(() => {
    if (!config) return undefined;

    const graph = buildIngredientPageSchemaGraph(config);
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = serializeSchemaGraph(graph);

    return () => {
      const el = document.getElementById(SCRIPT_ID);
      if (el) el.remove();
    };
  }, [config]);

  return null;
}

export default SchemaMarkup;
