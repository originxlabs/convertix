use crate::licensing::tier::Tier;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureGate {
    pub feature: String,
    pub min_tier: Tier,
    pub offline_allowed: bool,
    pub requires_license: bool,
    pub usage_key: Option<String>,
    pub monthly_limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateConfig {
    pub gates: Vec<FeatureGate>,
}

impl GateConfig {
    pub fn as_map(&self) -> HashMap<String, FeatureGate> {
        self.gates
            .iter()
            .cloned()
            .map(|g| (g.feature.clone(), g))
            .collect()
    }

    pub fn default() -> Self {
        Self {
            gates: vec![
                FeatureGate {
                    feature: "pdf.basic".into(),
                    min_tier: Tier::Free,
                    offline_allowed: true,
                    requires_license: false,
                    usage_key: None,
                    monthly_limit: None,
                },
                FeatureGate {
                    feature: "pdf.advanced".into(),
                    min_tier: Tier::Pro,
                    offline_allowed: true,
                    requires_license: true,
                    usage_key: None,
                    monthly_limit: None,
                },
                FeatureGate {
                    feature: "image.ai".into(),
                    min_tier: Tier::Pro,
                    offline_allowed: false,
                    requires_license: true,
                    usage_key: Some("images".into()),
                    monthly_limit: None,
                },
                FeatureGate {
                    feature: "noteflow.generations".into(),
                    min_tier: Tier::Free,
                    offline_allowed: true,
                    requires_license: false,
                    usage_key: Some("other_generations".into()),
                    monthly_limit: Some(5),
                },
            ],
        }
    }
}
