import { AndroidLogo } from "@phosphor-icons/react/dist/ssr";
import { ArrowLeft, Check, ChevronLeft, MoreVertical, Plus } from "lucide-react";
import { AppleLogo } from "../components/PlatformLogos";
import devices from "./DeviceFrames.module.css";
import { DeviceStatusBar } from "./DeviceStatusBar";
import ui from "./IllustrationUi.module.css";
import styles from "./PhoneIllustrations.module.css";

function NativeScreen({ android = false }: { android?: boolean }) {
  return (
    <div className={`${styles.nativeScreen} ${android ? styles.android : ""}`}>
      {android ? (
        <div className={styles.androidStatus} aria-hidden="true">
          <span>9:41</span>
          <span className={styles.androidSystem}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
              <path d="M1 10.5h2v2H1zm3-2h2v4H4zm3-2h2v6H7zm3-2h2v8h-2z" />
              <path d="M14 5.5h3v7h-3z" />
            </svg>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
              <path d="M1 5.2a12 12 0 0 1 16 0l-1.5 1.8a9.5 9.5 0 0 0-13 0zM4 8.3a7.6 7.6 0 0 1 10 0l-1.5 1.8a5.2 5.2 0 0 0-7 0zM7.3 11.4a2.7 2.7 0 0 1 3.4 0L9 13z" />
            </svg>
            <span className={styles.androidBattery} />
          </span>
        </div>
      ) : (
        <DeviceStatusBar className={styles.nativeStatus} />
      )}
      <div className={styles.nativeNav}>
        {android ? (
          <ArrowLeft size={22} />
        ) : (
          <span>
            <ChevronLeft size={20} /> Lists
          </span>
        )}
        <b>Shopping list</b>
        {android ? <MoreVertical size={22} /> : <span>Done</span>}
      </div>
      <div className={styles.nativeContent}>
        {android ? (
          <h4>Sunday dinner</h4>
        ) : (
          <>
            <span className={styles.nativeEyebrow}>Shopping list</span>
            <h4>Sunday dinner</h4>
          </>
        )}
        <p>Everything for a good evening.</p>
        <div className={styles.nativeSegments}>
          <span>
            To buy <b>4</b>
          </span>
          <span>
            In basket <b>2</b>
          </span>
        </div>
        <div className={styles.nativeList}>
          {[
            ["Cherry tomatoes", "250 g", false],
            ["Fresh mozzarella", "2 balls", false],
            ["Sourdough", "1 loaf", false],
            ["Basil", "1 bunch", false],
            ["Olive oil", "3 tbsp", true],
            ["Sea salt", "1 pinch", true],
          ].map(([name, amount, checked]) => (
            <div key={String(name)} className={styles.nativeRow}>
              <i data-checked={checked || undefined}>
                {checked && <Check size={14} strokeWidth={3} />}
              </i>
              <span style={checked ? { textDecoration: "line-through", opacity: 0.55 } : undefined}>
                {name}
              </span>
              <small>{amount}</small>
            </div>
          ))}
        </div>
        <div className={styles.nativeReminder}>
          <div>
            <strong>Remind me</strong>
            <small>When I arrive at the store</small>
          </div>
          <span className={styles.nativeSwitch}>
            <i />
          </span>
        </div>
        <div className={styles.nativeAdd}>
          <Plus size={20} /> Add item
        </div>
      </div>
      <div className={styles.nativeHome} />
    </div>
  );
}
export function NativeIllustration() {
  return (
    <div className={`${styles.wideScene} ${devices.devices} ${ui.ui}`}>
      <div className={styles.platformLabels}>
        <span>
          <AppleLogo className={styles.appleMark} /> iOS <small>Cupertino</small>
        </span>
        <span>
          <AndroidLogo size={20} weight="fill" /> Android <small>Material 3</small>
        </span>
      </div>
      {[false, true].map((android) => (
        <div
          key={String(android)}
          className={`${styles.nativeDevice} ${android ? styles.pixel : styles.iphone}`}
        >
          <div className={android ? styles.pixelFrame : "device device-iphone-14-pro"}>
            <div className="device-frame">
              <div className={`device-screen ${styles.phoneDisplay}`}>
                <NativeScreen android={android} />
              </div>
            </div>
            {android ? (
              <div className={styles.pixelCamera} />
            ) : (
              <>
                <div className="device-stripe" />
                <div className="device-header" />
                <div className="device-sensors" />
                <div className="device-btns" />
                <div className="device-power" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
