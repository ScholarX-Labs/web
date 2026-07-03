import React from "react";
import test, { describe } from "node:test";
import assert from "node:assert/strict";

const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
if (internals) {
  internals.H = {
    useContext: (ctx: any) => {
      return new Proxy(() => "en", {
        get(target, prop) {
          if (prop === "locale") return "en";
          return () => "en";
        }
      });
    },
    useState: (init: any) => [init, () => {}],
    useEffect: () => {},
    useTransition: () => [false, (cb: any) => cb()],
    use: (promiseOrContext: any) => {
      return "en";
    },
    useMemo: (fn: any) => fn(),
    useCallback: (fn: any) => fn,
  };
}

import { LocaleSwitcher } from "../../../src/components/locale-switcher";

describe("LocaleSwitcher component", () => {
  test("returns element tree with button for each locale", () => {
    const result = LocaleSwitcher({});
    assert.equal(result.type, "div");
    const children = result.props.children;
    assert.equal(children.length, 2);
  });
});
