import type { GalleryGroup } from "../components/gallery";
import "./ui-font.css";
import { PlaceChips, PlannerHome, WeatherLine } from "./home";
import { PlannerScrollSample } from "./scroll-sample";
import { StackedSheetSample } from "./sheet-sample";
import { LocationSample, MapSample, MiniMapSample } from "./map-sample";
import { FollowUpSample, HotelSheetSample, StepSample } from "./steps-sample";
import { ChatDatesAnsweredSample, ChatPieceSample } from "./chat/chat-pieces-sample";
import { ChatItinerarySample, ChatLoadingSample, ChatMessageSample, ChatPiecesSample, ChatTabsSample } from "./chat/chat-sample";
import { AskPanelSample, BoardSample, CardSample, DoodlesSample, HeartSample, ItinerarySpreadSample, LatestArrowSample, LoadingSample, MascotSample, TabsSample } from "./itinerary-sample";

// The planner's components, as their own group in /components. The weather is a fixed
// reading here so the stage doesn't ask for your location.
const sample = { place: "Bengaluru", country: "India", countryCode: "IN", temp: 28, high: 29, low: 21, code: 2, isDay: true };

export const plannerGroup: GalleryGroup = {
  title: "Planner",
  items: [
    {
      id: "planner-home",
      name: "Home",
      view: (
        <div className="pl-stage pl-stage--page">
          <PlannerHome weather={sample} />
        </div>
      ),
    },
    {
      id: "planner-weather",
      name: "Weather",
      view: (
        <div className="pl-stage">
          {/* The concierge's line for each kind of sky; each shows the plain line until its own arrives. */}
          <WeatherLine weather={{ place: "Lisbon", country: "Portugal", countryCode: "PT", temp: 22, high: 24, low: 15, code: 0, isDay: true }} />
          <WeatherLine weather={sample} />
          <WeatherLine weather={{ place: "Mumbai", country: "India", countryCode: "IN", temp: 27, high: 29, low: 25, code: 3, isDay: true }} />
          <WeatherLine weather={{ place: "London", country: "United Kingdom", countryCode: "GB", temp: 14, high: 15, low: 10, code: 63, isDay: true }} />
          <WeatherLine weather={{ place: "Dubai", country: "United Arab Emirates", countryCode: "AE", temp: 43, high: 45, low: 33, code: 0, isDay: true }} />
          <WeatherLine weather={{ place: "Reykjavík", country: "Iceland", countryCode: "IS", temp: -2, high: 0, low: -5, code: 73, isDay: true }} />
        </div>
      ),
    },
    {
      id: "planner-scroll",
      name: "Scroll",
      view: <PlannerScrollSample />,
    },
    { id: "planner-question", name: "Question", view: <StepSample id="question" /> },
    { id: "planner-picks", name: "Picks", view: <StepSample id="picks" /> },
    { id: "planner-dates", name: "Dates", view: <StepSample id="dates" /> },
    { id: "planner-followups", name: "Follow-up chips", view: <FollowUpSample /> },
    { id: "planner-hotel-sheet", name: "Hotel sheet", view: <HotelSheetSample /> },
    { id: "planner-tabs", name: "Tabs", view: <TabsSample /> },
    { id: "planner-heart", name: "Add to itinerary", view: <HeartSample /> },
    { id: "planner-itinerary-card", name: "Itinerary card", view: <CardSample /> },
    { id: "planner-board", name: "Itinerary board", view: <BoardSample /> },
    { id: "planner-itinerary-spread", name: "Itinerary spread", view: <ItinerarySpreadSample /> },
    { id: "planner-ask", name: "Explore panel", view: <AskPanelSample /> },
    { id: "planner-chat-tab", name: "Chat tab", view: <ChatTabsSample /> },
    { id: "planner-chat-message", name: "Chat message", view: <ChatMessageSample /> },
    { id: "planner-chat-loading", name: "Chat loading", view: <ChatLoadingSample /> },
    { id: "planner-chat-itinerary", name: "Chat itinerary card", view: <ChatItinerarySample /> },
    { id: "planner-chat-pieces", name: "Chat hotels and maps", view: <ChatPiecesSample /> },
    { id: "planner-chat-question", name: "Chat question", view: <ChatPieceSample id="question" /> },
    { id: "planner-chat-picks", name: "Chat picks", view: <ChatPieceSample id="picks" /> },
    { id: "planner-chat-dates", name: "Chat dates", view: <ChatPieceSample id="dates" /> },
    { id: "planner-chat-dates-answered", name: "Chat dates, answered", view: <ChatDatesAnsweredSample /> },
    { id: "planner-chat-route", name: "Chat route", view: <ChatPieceSample id="route" /> },
    { id: "planner-chat-dishes", name: "Chat dishes", view: <ChatPieceSample id="dishes" /> },
    { id: "planner-chat-versus", name: "Chat versus", view: <ChatPieceSample id="versus" /> },
    { id: "planner-chat-price", name: "Chat price", view: <ChatPieceSample id="price" /> },
    { id: "planner-chat-checklist", name: "Chat checklist", view: <ChatPieceSample id="checklist" /> },
    { id: "planner-map", name: "Map", view: <MapSample /> },
    { id: "planner-location", name: "Location", view: <LocationSample /> },
    { id: "planner-minimap", name: "Mini map", view: <MiniMapSample /> },
    { id: "planner-stickers", name: "Stickers", view: <DoodlesSample /> },
    { id: "planner-mascot", name: "Mascot", view: <MascotSample /> },
    { id: "planner-loading", name: "Loading", view: <LoadingSample /> },
    { id: "planner-latest", name: "Newest page arrow", view: <LatestArrowSample /> },
    {
      id: "planner-sheet",
      name: "Stacked sheet",
      view: <StackedSheetSample />,
    },
    {
      id: "planner-chips",
      name: "Place chips",
      view: (
        <div className="pl-stage">
          <PlaceChips />
        </div>
      ),
    },
  ],
};
