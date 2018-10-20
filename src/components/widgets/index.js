import React from "react";
import { createWidget } from "./lib";
import { capitalize } from "lodash";
import config from "./../../config";
import loadable from "loadable-components";
import { Loader } from "semantic-ui-react";

const templates = {};
const registerTemplate = ({ code, name, tags, icon, description }) => {
  templates[code] = {
    code,
    name,
    tags,
    icon,
    description,
    component: loadable(() => import(`./templates/${code}`), {
      render: ({ Component, error, loading, ownProps }) => {
        if (error) return <div>Oups! {error.message}</div>;
        if (loading) return <Loader inline="centered" />;
        return (
          <Component
            {...ownProps}
            {...{
              code,
              name,
              tags,
              icon,
              description
            }}
          />
        );
      }
    })
  };
};

const manifests = {
  HelloWorld: createWidget(import("./HelloWorld"), {
    icon: "plus",
    disabled: true
  }),
  PriceTag: createWidget(import("./PriceTag"), {
    icon: "money bill alternate",
    weight: 0,
    metadata(widget, entity) {
      switch (entity.__typename) {
        case "Post":
          const section = config.sections.find(
            ({ key }) => key === entity.section
          );
          const { currency, price } = widget.values;
          return {
            color: section.color,
            key: widget.name,
            text: `${currency} ${Number(price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          };
        default:
          return {};
      }
    }
  }),
  Color: createWidget(import("./Color"), {
    icon: "paint brush",
    weight: 1,
    metadata(widget, entity) {
      switch (entity.__typename) {
        case "Post":
          const { color } = widget.values;
          return {
            color,
            key: widget.name,
            text: capitalize(color)
          };
        default:
          return {};
      }
    }
  }),
  Quality: createWidget(import("./Quality"), { icon: "shield alternate" })
};

for (const tpl of config.templates) {
  registerTemplate(tpl);
}

export { manifests, templates };
