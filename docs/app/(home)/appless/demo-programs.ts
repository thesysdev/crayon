// Source: applessintro-html-demo/assets/appless-demo.js, presentation slide 16.
// Presentation programs adapted with photo cards and an illustrative map. Scripted replay, no model calls.
// demo-pizza.jpg is the presentation's Unsplash demo photo, reused with the same program.
export const scenes = [
  {
    key: "dinner",
    request: "Order dinner from nearby",
    source:
      '@AppIcon("🍕", "#ff6b22")\nroot = Card([header, chips, categories, title, nearby, cta])\nheader = CardHeader("Dinner Delivery")\nchips = Chips(["All", "Top Rated", "Fastest", "Under $25"])\ncategories = ListBlock([sushi, italian, thai], "CATEGORIES")\nsushi = FoodCategory("Sushi", "/appless/demo-sushi.jpg")\nitalian = FoodCategory("Italian", "/appless/demo-pizza.jpg")\nthai = FoodCategory("Thai", "/appless/demo-thai.jpg")\ntitle = TextContent("Popular nearby", "large-heavy")\nnearby = ListBlock([sakura, luigi, thai2])\nsakura = ListItem("Sakura Zen", "4.8 ★ · 22 min · $$", "/appless/demo-sushi.jpg", "Free Delivery", Action([@ToAssistant("Open Sakura Zen menu")]))\nluigi = ListItem("Luigi’s Hearth", "4.7 ★ · 18 min · $$", "/appless/demo-pizza.jpg", "$2.99 Delivery", Action([@ToAssistant("Open Luigi’s Hearth menu")]))\nthai2 = ListItem("Lemongrass Thai", "4.6 ★ · 30 min · $$", "/appless/demo-thai.jpg", "Free Delivery", Action([@ToAssistant("Open Lemongrass Thai menu")]))\ncta = Button("Reorder Usual", Action([@ToAssistant("Open my usual dinner order")]), "primary")',
  },
  {
    key: "truffle",
    request: "Customize the Truffle Mushroom pizza",
    source:
      '@AppIcon("🍕", "#ff6b22")\nroot = Card([hero, details, menu, cta])\nhero = ImageBlock("/appless/demo-pizza.jpg", "Luigi’s Hearth")\ndetails = ProductDetails("Truffle Mushroom", "Wood-fired crust, roasted mushrooms, mozzarella and a drizzle of truffle oil.", "$25.00", "4.7", "18–20 min")\nmenu = ListBlock([extra, garlic], "CUSTOMIZE")\nextra = Toggle("Extra truffle oil", true, "sparkles", "+$2.00")\ngarlic = Toggle("Garlic knots", false, "circle-plus", "+$6.00")\ncta = Button("Add to Cart", Action([@ToAssistant("Add the Truffle Mushroom pizza to cart and show the cart")]), "primary")',
  },
  {
    key: "cart",
    request: "Add the pizza to my cart",
    source:
      '@AppIcon("🛒", "#bf5af2")\nroot = Card([header, items, summary, actions])\nheader = CardHeader("Your Cart", "LUIGI’S HEARTH")\nitems = ListBlock([pizza], "1 ITEM")\npizza = ProductItem("Truffle Mushroom Pizza", "12-inch · Extra Truffle Drizzle", "/appless/demo-pizza.jpg", "$25.00")\nsummary = KVList([{label: "Subtotal", value: "$25.00"}, {label: "Delivery Fee", value: "$2.99"}, {label: "Estimated Tax", value: "$2.12"}, {label: "Total", value: "$30.11"}], "ORDER SUMMARY")\ncheckout = Button("Checkout", Action([@ToAssistant("Open checkout for Luigi’s Hearth")]), "primary")\nmore = Button("Add more items", Action([@ToAssistant("Return to Luigi’s Hearth menu")]), "secondary")\nactions = Buttons([checkout, more])',
  },
  {
    key: "checkout",
    request: "Checkout with saved delivery and payment details",
    source:
      '@AppIcon("💳", "#0a84ff")\nroot = Card([header, map, delivery, payment, summary, place])\nheader = CardHeader("Checkout")\nmap = DeliveryMap("422 West 14th St", "18–20 min")\ndelivery = ListBlock([home, time, note], "DELIVERY DETAILS")\nhome = ListItem("Home", "422 West 14th St", "home", "Selected")\ntime = ListItem("Delivery time", "18–20 min · Tonight", "clock")\nnote = ListItem("Add Note", "No substitutions", "message-circle")\npayment = ListBlock([visa, pay], "PAYMENT")\nvisa = ListItem("Visa •• 4822", null, "credit-card", "Selected")\npay = ListItem("Apple Pay", null, "wallet")\nsummary = KVList([{label: "Order total", value: "$30.11"}])\nplace = Button("Place Order", Action([@ToAssistant("Place the order and show confirmation")]), "primary")',
  },
] as const;
