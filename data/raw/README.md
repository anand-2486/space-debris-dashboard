# Raw Data Repository

**Critical Rule:** Never modify raw source files in this directory. 
**Source:** CelesTrak GP/OMM data[cite: 1, 3].
**Policy:** Data flows strictly from `raw` -> `normalized` -> `cached`[cite: 1]. Any malformed records should be flagged or rejected during the normalization step, never manually edited here[cite: 1].