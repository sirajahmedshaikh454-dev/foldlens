import { useEffect, useState } from "react";
import { Microscope, Telescope, FlaskConical, GraduationCap } from "lucide-react";
import { api } from "./api";
import Explorer from "./pages/Explorer";
import LigandBench from "./pages/LigandBench";
import FoldSchool from "./pages/FoldSchool";

const NAV = [
  ["explore", "Explorer", Telescope],
  ["ligands", "Ligand Bench", FlaskConical],
  ["school", "Fold School", GraduationCap],
];

const parse = () => {
  const [, page = "explore", arg] = location.hash.split("/");
  return { page, arg };
};

export default function App() {
  const [route, setRoute] = useState(parse);
  const [health, setHealth] = useState({});

  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  // re-check on every page change so the banner clears once the backend comes up
  useEffect(() => {
    api("/health").then(setHealth).catch(() => setHealth({ down: true }));
  }, [route.page, route.arg]);

  const go = (hash) => { location.hash = hash; };

  return (
    <>
      <header className="top">
        <a className="brand" href="#/explore"><Microscope size={26} aria-hidden />FoldLens</a>
        <nav aria-label="Main">
          {NAV.map(([key, label, Icon]) => (
            <a key={key} href={`#/${key}`} aria-current={route.page === key ? "page" : undefined}>
              <Icon size={18} aria-hidden />{label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        {health.down && <p className="error card" role="alert">Can't reach the FoldLens API. Start the Flask backend on port 5000.</p>}
        {route.page === "ligands" ? <LigandBench rdkitReady={health.rdkit === true} />
          : route.page === "school" ? <FoldSchool go={go} />
          : <Explorer key={route.arg} initial={route.arg} esmReady={!!health.esm} />}
      </main>
    </>
  );
}
