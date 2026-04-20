// src/components/index.js

const modules = import.meta.glob("./*.vue", { eager: true });

export default Object.fromEntries(
  Object.entries(modules).map(([path, module]) => {
    const name = path.split("/").pop().replace(".vue", "");
    return [name, module.default];
  }),
);
