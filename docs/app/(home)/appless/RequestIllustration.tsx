import { Check, Clock3, Star } from "lucide-react";
import Image from "next/image";
import mapStyles from "./DeliveryMap.module.css";
import devices from "./DeviceFrames.module.css";
import { DeviceStatusBar } from "./DeviceStatusBar";
import ui from "./IllustrationUi.module.css";
import styles from "./PhoneIllustrations.module.css";

const promptLabels = [
  "Order dinner nearby",
  "Customize my pizza",
  "Add pizza to cart",
  "Checkout my order",
];

function Restaurant({ kind = "pizza" }: { kind?: "pizza" | "sushi" }) {
  const sushi = kind === "sushi";
  return (
    <div className={styles.restaurant}>
      <div className={styles.restaurantInfo}>
        <span className={styles.restaurantCategory}>
          {sushi ? "Sushi · Japanese" : "Pizza · Italian"}
        </span>
        <strong>{sushi ? "Sakura Zen" : "Luigi’s Hearth"}</strong>
        <span className={styles.restaurantRating}>
          <Star size={13} fill="currentColor" /> {sushi ? "4.8" : "4.7"}
          <small>{sushi ? "(320+)" : "(500+)"}</small>
        </span>
        <span className={styles.restaurantDelivery}>
          {sushi ? "25–35 min · Free delivery" : "20–30 min · $2.99 delivery"}
        </span>
      </div>
      <Image
        src={sushi ? "/appless/demo-sushi.jpg" : "/appless/demo-pizza.jpg"}
        width={128}
        height={128}
        alt=""
      />
    </div>
  );
}

function PhoneContent({ scene }: { scene: number }) {
  if (scene === 0) {
    return (
      <>
        <div className={styles.answerHead}>
          <strong>Dinner nearby</strong>
          <span>Delivered to Home</span>
        </div>
        <div className={styles.filters}>
          <span className={`${ui.button} ${ui.solid}`}>All food</span>
          <span className={ui.button}>Pizza</span>
          <span className={ui.button}>Sushi</span>
        </div>
        <div className={styles.foodGrid}>
          <Restaurant />
          <Restaurant kind="sushi" />
        </div>
      </>
    );
  }
  if (scene === 1) {
    return (
      <>
        <div className={styles.requestProductPhoto}>
          <Image src="/appless/demo-pizza.jpg" fill sizes="(max-width: 767px) 42vw, 280px" alt="" />
        </div>
        <div className={styles.requestProductBody}>
          <span className={styles.restaurantCategory}>Luigi’s Hearth · Pizza</span>
          <div className={styles.requestProductTitle}>
            <strong>Truffle Mushroom</strong>
            <b>$25.00</b>
          </div>
          <p>Wood-fired crust, roasted mushrooms, mozzarella, and truffle oil.</p>
          <span className={styles.requestProductMeta}>
            <Star size={14} fill="currentColor" /> 4.7 <Clock3 size={14} /> 18–20 min
          </span>
          <div className={styles.requestOption}>
            Extra truffle oil <span>+$2.00</span>
          </div>
        </div>
      </>
    );
  }
  if (scene === 2) {
    return (
      <>
        <div className={styles.answerHead}>
          <strong>Your cart</strong>
          <span>Luigi’s Hearth</span>
        </div>
        <div className={styles.requestCartItem}>
          <Image src="/appless/demo-pizza.jpg" width={110} height={110} alt="" />
          <div>
            <strong>Truffle Mushroom Pizza</strong>
            <span>12-inch · Extra truffle drizzle</span>
            <b>$25.00</b>
          </div>
        </div>
        <div className={styles.requestCartTotal}>
          <span>
            Subtotal <b>$25.00</b>
          </span>
          <span>
            Delivery <b>$2.99</b>
          </span>
          <span>
            Total <b>$30.11</b>
          </span>
        </div>
        <div className={styles.requestAction}>Checkout</div>
      </>
    );
  }
  return (
    <>
      <div className={styles.answerHead}>
        <strong>Checkout</strong>
        <span>Luigi’s Hearth</span>
      </div>
      <div className={styles.requestMap}>
        <svg
          className={mapStyles.map}
          viewBox="0 0 340 150"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="340" height="150" fill="var(--map-land)" />
          <path d="M0 0h56L20 150H0z" fill="var(--map-water)" />
          <path d="M250 0h72v35h-72zM64 102h52v48H64z" fill="var(--map-park)" />
          <g stroke="var(--map-road)" strokeWidth="9">
            <path d="M66-10 40 160M126-10 98 160M190-10 165 160M253-10 229 160M318-10 295 160M18 45 350 93M20 104 330 145M30-8 325 36" />
          </g>
          <path
            d="m109 116 8-56 126 18 8-40"
            fill="none"
            stroke="var(--map-route-halo)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="m109 116 8-56 126 18 8-40"
            fill="none"
            stroke="var(--map-route)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            cx="109"
            cy="116"
            r="7"
            fill="var(--map-route)"
            stroke="var(--map-road)"
            strokeWidth="3"
          />
          <circle
            cx="251"
            cy="38"
            r="10"
            fill="var(--map-pin)"
            stroke="var(--map-road)"
            strokeWidth="3"
          />
        </svg>
        <div>
          <strong>Arriving in 18–20 min</strong>
          <span>422 West 14th St</span>
        </div>
      </div>
      <div className={styles.requestCheckoutRow}>
        <span>Home</span>
        <span>
          <Check size={14} /> 422 West 14th St
        </span>
      </div>
      <div className={styles.requestCheckoutRow}>
        <span>Payment</span>
        <span>Visa ···· 4822</span>
      </div>
    </>
  );
}

export function RequestIllustration() {
  return (
    <div className={`${styles.wideScene} ${devices.devices} ${ui.ui}`}>
      <div className={styles.requestQueue}>
        <div className={styles.requestQueueTrack}>
          {Array.from({ length: 12 }, (_, index) => (
            <div className={styles.requestQueueItem} key={index} data-row={index}>
              {promptLabels[index % promptLabels.length]}
            </div>
          ))}
        </div>
      </div>
      <div className={`${styles.requestPhone} device device-iphone-14-pro`}>
        <div className="device-frame">
          <div className={`device-screen ${styles.requestScreen}`}>
            <DeviceStatusBar className={styles.requestStatus} />
            <div className={styles.requestScreens}>
              {promptLabels.map((label, index) => (
                <div className={styles.requestContent} key={label} data-scene={index}>
                  <PhoneContent scene={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="device-stripe" />
        <div className="device-header" />
        <div className="device-sensors" />
        <div className="device-btns" />
        <div className="device-power" />
      </div>
    </div>
  );
}
