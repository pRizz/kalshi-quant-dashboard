# Future Work (Deferred in v1)

The following analytics and risk modules are intentionally **deferred** for v1 to keep scope tight while preserving extensibility:

Source reference for all deferred items:

- https://gist.githubusercontent.com/pRizz/ff0c6ee6bc12865af6b4e6c8bcb1504b/raw/57bb8c18e532e516656e5a7ad7765c412eda2138/gistfile1.txt

## Deferred Analytics Modules

1. **Importance sampling for rare-event tail contracts**
   - Planned approach: add an alternative sampler in analytics-core with likelihood-ratio weighting and variance reduction diagnostics.

2. **Sequential Monte Carlo / particle filters**
   - Planned approach: add state-space model interfaces and online update pipelines for streaming market observations.

3. **Copula portfolio simulation**
   - Planned approach: support Gaussian/t-copula portfolio simulation in an advanced dependency module with tail-dependence controls.

4. **Agent-based market microstructure simulations**
   - Planned approach: add heterogeneous agent models (informed/noise/MM) and order-book impact diagnostics.

5. **Kelly sizing**
   - Planned approach: portfolio sizing utility based on edge and variance estimates from calibrated probabilities.

6. **VaR / CVaR / drawdowns / stress testing**
   - Planned approach: scenario engine over historical/simulated distributions with stress templates and risk-budget outputs.

## Data Layer Alternatives

7. **Prisma / raw SQL alternatives**
   - Planned approach: document adapter abstractions in repository layer to allow interchangeable DB backends.
