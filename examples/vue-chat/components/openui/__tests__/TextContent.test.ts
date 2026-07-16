import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import TextContent from "../TextContent.vue";

const mountText = (text: string) =>
  mount(TextContent, {
    props: { props: { text } },
  });

describe("TextContent", () => {
  it("renders plain text", async () => {
    const wrapper = mountText("Hello world");
    await nextTick();
    expect(wrapper.text()).toBe("Hello world");
  });

  it("renders bold markdown", async () => {
    const wrapper = mountText("**bold**");
    await nextTick();
    expect(wrapper.find("strong").exists()).toBe(true);
    expect(wrapper.find("strong").text()).toBe("bold");
  });

  it("renders inline code", async () => {
    const wrapper = mountText("`code`");
    await nextTick();
    expect(wrapper.find("code").exists()).toBe(true);
    expect(wrapper.find("code").text()).toBe("code");
  });

  it("escapes raw HTML", async () => {
    const wrapper = mountText('<script>alert(1)</script>');
    await nextTick();
    expect(wrapper.html()).not.toContain("<script>");
    expect(wrapper.html()).toContain("&lt;script&gt;");
  });
});
