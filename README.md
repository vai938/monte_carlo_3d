# Monte Carlo 3D Pi Estimation

Monte Carlo Estimation of Pi using an interactive 3D model built with React, TypeScript, Three.js, and GSAP.

## Features

- **3D Visualization**: Interactive Three.js scene featuring a cube with an inscribed sphere.
- **Monte Carlo Simulation**: Randomly generates particles and determines whether they lie inside the sphere or within the enclosing cube to approximate the value of $\pi$ ($6 \times \frac{p_{in}}{p_{total}}$).
- **Interactive Camera Rotation**: Smooth mouse-driven camera and object rotation powered by GSAP.
- **CSV Data Export**: Download calculated $\pi$ values per iteration as `Monte-carlo-3d_data.csv`.

## Development

Run development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```
