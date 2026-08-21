import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import { createVuetify } from "vuetify"
import type { Component } from "vue"
import AppLogo from "@/components/AppLogo.vue"

const vuetify = createVuetify()

function mountWithVuetify(component: Component, options = {}) {
  return mount(component, {
    global: { plugins: [vuetify] },
    ...options,
  })
}

describe("AppLogo.vue", () => {
  it("renders an SVG", () => {
    const wrapper = mountWithVuetify(AppLogo)
    expect(wrapper.find("svg").exists()).toBe(true)
  })

  it("uses default size 28 when no size prop", () => {
    const wrapper = mountWithVuetify(AppLogo)
    expect(wrapper.find("svg").attributes("width")).toBe("28")
    expect(wrapper.find("svg").attributes("height")).toBe("28")
  })

  it("respects custom size prop", () => {
    const wrapper = mountWithVuetify(AppLogo, { props: { size: 64 } })
    expect(wrapper.find("svg").attributes("width")).toBe("64")
    expect(wrapper.find("svg").attributes("height")).toBe("64")
  })
})
