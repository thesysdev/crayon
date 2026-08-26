import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent as defineVueComponent, h, nextTick } from "vue";
import { z } from "zod/v4";
import Renderer from "../Renderer.vue";
import { useOpenUI } from "../context.js";
import { createLibrary, defineComponent } from "../library.js";

async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe("Renderer Query and Mutation Support", () => {
  const TicketList = defineVueComponent({
    name: "TicketList",
    props: ["props"],
    setup() {
      const ctx = useOpenUI();
      return { ctx };
    },
    template: `
      <div>
        <div id="loading">{{ ctx.isQueryLoading.value ? 'loading' : 'idle' }}</div>
        <div v-for="ticket in props.tickets" :key="ticket.id" class="ticket">
          {{ ticket.title }}
        </div>
      </div>
    `,
  });

  const TicketListComponent = defineComponent({
    name: "TicketList",
    props: z.object({
      tickets: z.array(z.object({ id: z.string(), title: z.string() })),
    }),
    description: "Displays a list of tickets",
    component: TicketList as any,
  });

  const TicketCreator = defineVueComponent({
    name: "TicketCreator",
    props: ["props"],
    setup(props) {
      const ctx = useOpenUI();
      const create = () => {
        ctx.triggerAction("Create Ticket", undefined, props.props.onSave);
      };
      return { create };
    },
    template: `
      <div>
        <div id="mut-status">{{ props.status }}</div>
        <button id="create-btn" @click="create">Create</button>
      </div>
    `,
  });

  const TicketCreatorComponent = defineComponent({
    name: "TicketCreator",
    props: z.object({
      status: z.string().optional(),
      onSave: z.any().optional(),
    }),
    description: "Creates tickets",
    component: TicketCreator as any,
  });

  const library = createLibrary({
    components: [TicketListComponent, TicketCreatorComponent],
    root: "TicketList",
  });

  it("performs query and resolves data asynchronously", async () => {
    const toolProvider = {
      list_tickets: vi.fn().mockResolvedValue([
        { id: "1", title: "Ticket One" },
        { id: "2", title: "Ticket Two" },
      ]),
    };

    const response = `
      tickets = Query("list_tickets", {}, [])
      root = TicketList(tickets)
    `;

    const wrapper = mount(Renderer, {
      props: {
        response,
        library,
        toolProvider,
      },
    });

    // Before query resolves, it should render the default value (empty list)
    expect(wrapper.find("#loading").text()).toBe("loading");
    expect(wrapper.findAll(".ticket").length).toBe(0);

    // Let the async tool call resolve and Vue update DOM
    await flushMicrotasks();
    await nextTick();

    // Now it should show the loaded items and idle status
    expect(wrapper.find("#loading").text()).toBe("idle");
    const tickets = wrapper.findAll(".ticket");
    expect(tickets.length).toBe(2);
    expect(tickets[0]?.text()).toBe("Ticket One");
    expect(tickets[1]?.text()).toBe("Ticket Two");
    expect(toolProvider.list_tickets).toHaveBeenCalled();
  });

  it("handles query failures and propagates errors via onError", async () => {
    const onError = vi.fn();
    const toolProvider = {
      list_tickets: vi.fn().mockRejectedValue(new Error("Database offline")),
    };

    const response = `
      tickets = Query("list_tickets", {}, [])
      root = TicketList(tickets)
    `;

    mount(Renderer, {
      props: {
        response,
        library,
        toolProvider,
        onError,
      },
    });

    await flushMicrotasks();
    await nextTick();

    expect(onError).toHaveBeenCalled();
    const calls = onError.mock.calls;
    const errors = (calls[calls.length - 1] as any)?.[0] || [];
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("tool-error");
    expect(errors[0].message).toContain("Database offline");
  });

  it("supports custom queryLoader component", async () => {
    const CustomLoader = defineVueComponent({
      name: "CustomLoader",
      template: `<div id="custom-loader">Loading tickets...</div>`,
    });

    const toolProvider = {
      list_tickets: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    };

    const response = `
      tickets = Query("list_tickets", {}, [])
      root = TicketList(tickets)
    `;

    const wrapper = mount(Renderer, {
      props: {
        response,
        library,
        toolProvider,
        queryLoader: CustomLoader,
      },
    });

    expect(wrapper.find("#custom-loader").exists()).toBe(true);
    expect(wrapper.find("#custom-loader").text()).toBe("Loading tickets...");
  });

  it("supports mutations, tracks status, and invalidates queries on run", async () => {
    const mockListTickets = vi
      .fn()
      .mockResolvedValueOnce([{ id: "1", title: "Original Ticket" }])
      .mockResolvedValueOnce([
        { id: "1", title: "Original Ticket" },
        { id: "2", title: "Created Ticket" },
      ]);

    let resolveMutation: (value: any) => void;
    const mutationPromise = new Promise((resolve) => {
      resolveMutation = resolve;
    });
    const mockCreateTicket = vi.fn().mockReturnValue(mutationPromise);

    const toolProvider = {
      list_tickets: mockListTickets,
      create_ticket: mockCreateTicket,
    };

    // Define a wrapper component that renders both TicketCreator and TicketList
    const Container = defineVueComponent({
      name: "Container",
      props: ["props", "renderNode"],
      setup(props) {
        return () => h("div", {}, props.renderNode(props.props.children));
      },
    });

    const ContainerComponent = defineComponent({
      name: "Container",
      props: z.object({
        children: z.any(),
      }),
      description: "Simple container",
      component: Container as any,
    });

    const extendedLibrary = createLibrary({
      components: [TicketListComponent, TicketCreatorComponent, ContainerComponent],
      root: "Container",
    });

    const response = `
      tickets = Query("list_tickets", {}, [])
      createResult = Mutation("create_ticket", { title: "Created Ticket" })
      root = Container(
        [
          TicketCreator(createResult.status, Action([@Run(createResult), @Run(tickets)])),
          TicketList(tickets)
        ]
      )
    `;

    const wrapper = mount(Renderer, {
      props: {
        response,
        library: extendedLibrary,
        toolProvider,
      },
    });

    // Wait for the initial query to load
    await flushMicrotasks();
    await nextTick();

    expect(wrapper.findAll(".ticket").length).toBe(1);
    expect(wrapper.find(".ticket").text()).toBe("Original Ticket");
    expect(wrapper.find("#mut-status").text()).toBe("idle");

    // Click "Create" button to fire mutation
    await wrapper.find("#create-btn").trigger("click");

    // Let the mutation action start and update reactive state
    await flushMicrotasks();
    await nextTick();

    // While mutation is running (before we resolve the promise), status should be loading
    expect(wrapper.find("#mut-status").text()).toBe("loading");

    // Resolve the mutation tool call
    resolveMutation!({ id: "2", title: "Created Ticket" });

    // Let the mutation finish and the invalidated query resolve
    await flushMicrotasks();
    await nextTick();

    // Now status should be success and ticket list should be updated
    expect(wrapper.find("#mut-status").text()).toBe("success");
    const tickets = wrapper.findAll(".ticket");
    expect(tickets.length).toBe(2);
    expect(tickets[0]?.text()).toBe("Original Ticket");
    expect(tickets[1]?.text()).toBe("Created Ticket");

    expect(mockCreateTicket).toHaveBeenCalledWith({ title: "Created Ticket" });
  });

  it("handles mutation failures and exposes error status", async () => {
    const onError = vi.fn();
    const mockCreateTicket = vi.fn().mockRejectedValue(new Error("Unauthorized"));

    const toolProvider = {
      list_tickets: vi.fn().mockResolvedValue([]),
      create_ticket: mockCreateTicket,
    };

    const response = `
      tickets = Query("list_tickets", {}, [])
      createResult = Mutation("create_ticket", { title: "Fail Ticket" })
      root = TicketCreator(createResult.status, Action([@Run(createResult)]))
    `;

    const wrapper = mount(Renderer, {
      props: {
        response,
        library,
        toolProvider,
        onError,
      },
    });

    await flushMicrotasks();
    await nextTick();

    await wrapper.find("#create-btn").trigger("click");
    await flushMicrotasks();
    await nextTick();

    // Check mutation status is set to error
    expect(wrapper.find("#mut-status").text()).toBe("error");
    expect(onError).toHaveBeenCalled();
    const calls = onError.mock.calls;
    const errors = (calls[calls.length - 1] as any)?.[0] || [];
    expect(
      errors.some((e: any) => e.code === "tool-error" && e.message.includes("Unauthorized")),
    ).toBe(true);
  });

  it("handles transition of toolProvider from null to active provider", async () => {
    const toolProvider = {
      list_tickets: vi.fn().mockResolvedValue([{ id: "1", title: "Async Ticket" }]),
    };

    const response = `
      tickets = Query("list_tickets", {}, [])
      root = TicketList(tickets)
    `;

    const wrapper = mount(Renderer, {
      props: {
        response,
        library,
        toolProvider: null,
      },
    });

    // Since toolProvider is null initially, it cannot execute, so it should be idle
    expect(wrapper.find("#loading").text()).toBe("idle");
    expect(wrapper.findAll(".ticket").length).toBe(0);

    // Now set toolProvider to active provider
    await wrapper.setProps({ toolProvider });

    // Let query run and resolve
    await flushMicrotasks();
    await nextTick();

    expect(wrapper.find("#loading").text()).toBe("idle");
    const tickets = wrapper.findAll(".ticket");
    expect(tickets.length).toBe(1);
    expect(tickets[0]?.text()).toBe("Async Ticket");
    expect(toolProvider.list_tickets).toHaveBeenCalled();
  });
});
