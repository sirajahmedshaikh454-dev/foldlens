import { useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";

const LESSONS = [
  {
    title: "What is a protein shape?", acc: "P69905",
    body: "A protein is a chain of amino acids that folds into a precise 3D shape. Haemoglobin α folds into tight helices that cradle an iron-holding heme group, and that shape is what lets your blood carry oxygen.",
    task: "Open it and rotate the model. Count the helices (the ribbon spirals).",
    q: "What decides a protein's shape?", opts: ["Its amino-acid sequence", "The temperature of the lab", "Its colour"], a: 0,
  },
  {
    title: "Reading AlphaFold's confidence", acc: "P04637",
    body: "AlphaFold scores every residue from 0 to 100 (pLDDT). p53 has a solid, dark-blue DNA-binding core, but long orange tails that are genuinely floppy in real life, not mistakes.",
    task: "Open p53 and look at the Trust Map. Find the longest very-low region.",
    q: "An orange (pLDDT < 50) region most likely means...", opts: ["The protein is broken there", "That region is flexible or disordered", "AlphaFold crashed"], a: 1,
  },
  {
    title: "One letter can matter", acc: "P04637",
    body: "R175H is one of the most common mutations in human cancer. A single arginine becomes histidine inside p53's core and the protein can no longer hold its shape.",
    task: "Open p53 → Variant Lens → type R175H. Then try R175K and compare.",
    q: "Why are buried mutations often worse than surface ones?", opts: ["They are harder to see", "The packed core has no room for changes in size or charge", "Surface residues don't matter"], a: 1,
  },
  {
    title: "Glowing proteins", acc: "P42212",
    body: "Green fluorescent protein folds into a β-barrel that protects a light-emitting chromophore in its centre. Scientists use it to make cells glow.",
    task: "Open GFP. Notice the barrel built from flat β-strands (the arrows).",
    q: "What protects GFP's chromophore?", opts: ["A β-barrel", "A cell wall", "A lipid membrane"], a: 0,
  },
  {
    title: "From structure to drugs", acc: null,
    body: "Drug designers look for pockets on a protein's surface, then search for molecules that fit. Before docking, they filter candidates for drug-likeness.",
    task: "Open Ligand Bench and rank the sample molecules. Which famous drug scores lowest?",
    q: "A QED score near 1 means a molecule...", opts: ["Definitely binds the target", "Looks like a typical oral drug", "Is toxic"], a: 1,
  },
];

function Quiz({ q, opts, a }) {
  const [pick, setPick] = useState(null);
  return (
    <div className="quiz">
      <b>Quick check:</b> {q}
      <div className="opts" role="group" aria-label={q}>
        {opts.map((o, i) => (
          <button key={o} onClick={() => setPick(i)} aria-pressed={pick === i}
            className={pick === null ? "" : i === a ? "right" : pick === i ? "wrong" : ""}>{o}</button>
        ))}
      </div>
      {pick !== null && <p aria-live="polite" style={{ marginTop: ".5rem" }}>{pick === a ? "Correct!" : "Not quite. The green option is right."}</p>}
    </div>
  );
}

export default function FoldSchool({ go }) {
  return (
    <>
      <section className="hero">
        <h1>Fold School</h1>
        <p>Five short lessons on real AlphaFold structures. Each one ends with a hands-on task in FoldLens.</p>
      </section>
      <div className="grid lessons">
        {LESSONS.map((l, i) => (
          <article className="card lesson" key={l.title}>
            <span className="step">LESSON {i + 1}</span>
            <h3><GraduationCap size={20} aria-hidden />{l.title}</h3>
            <p>{l.body}</p>
            <p><b>Try it:</b> {l.task}</p>
            <button className="ghost" onClick={() => go(l.acc ? `#/explore/${l.acc}` : "#/ligands")}>
              {l.acc ? `Open ${l.acc}` : "Open Ligand Bench"}<ArrowRight size={16} aria-hidden />
            </button>
            <Quiz q={l.q} opts={l.opts} a={l.a} />
          </article>
        ))}
      </div>
    </>
  );
}
