use std::{cell::RefCell, rc::Rc};
use serde_json::Value;
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{Document, Element, Event, MediaQueryListEvent, KeyboardEvent, Storage};

const SUN: &str = r#"<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>"#;
const MOON: &str = r#"<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 13.2A8.5 8.5 0 0 1 10.8 3.5a8.5 8.5 0 1 0 9.7 9.7Z"/></svg>"#;
const COPY: &str = include_str!("translations.json");

#[derive(Clone, Copy, Debug, PartialEq)]
enum Language { Hu, En }
impl Language {
    fn parse(value: &str) -> Option<Self> {
        match value { "hu" => Some(Self::Hu), "en" => Some(Self::En), _ => None }
    }
    fn code(self) -> &'static str { if self == Self::Hu { "hu" } else { "en" } }
    fn text<'a>(self, hu: &'a str, en: &'a str) -> &'a str {
        if self == Self::Hu { hu } else { en }
    }
}
fn default_language(country: Option<&str>, browser: &str) -> Language {
    match country {
        Some("HU") => Language::Hu,
        Some(code) if code.len() == 2 && code != "XX" && code != "T1" => Language::En,
        _ if browser.to_ascii_lowercase().starts_with("hu") => Language::Hu,
        _ => Language::En,
    }
}
fn saved_theme(value: Option<&str>, system_dark: bool) -> (bool, bool) {
    match value {
        Some("dark") => (true, true),
        Some("light") => (false, true),
        _ => (system_dark, false),
    }
}
fn stored(storage: &Option<Storage>, key: &str) -> Option<String> {
    storage.as_ref()?.get_item(key).ok().flatten()
}
fn element(document: &Document, selector: &str) -> Result<Element, JsValue> {
    document.query_selector(selector)?.ok_or_else(|| JsValue::from_str(&format!("Missing element: {selector}")))
}
struct App {
    document: Document,
    storage: Option<Storage>,
    language: Language,
    dark: bool,
    manual_theme: bool,
    translations: Value,
    carousel_index: usize,
}
impl App {
    fn render(&self) -> Result<(), JsValue> {
        let document = &self.document;
        let root = element(document, "html")?;
        let lang = self.language;
        root.set_attribute("lang", lang.code())?;
        root.set_attribute("data-theme", if self.dark { "dark" } else { "light" })?;
        if let Some(carousel) = document.query_selector(".process-carousel")? {
            let index = self.carousel_index;
            carousel.set_attribute("aria-label", lang.text("A tervezés folyamata", "Design process"))?;
            element(document, "[data-carousel-title]")?.set_attribute("data-i18n", &(80 + index * 2).to_string())?;
            element(document, "[data-carousel-description]")?.set_attribute("data-i18n", &(81 + index * 2).to_string())?;
            element(document, ".process-art")?.set_attribute("data-step", &index.to_string())?;
            element(document, ".process-number")?.set_text_content(Some(&format!("{:02}", index + 1)));
            element(document, ".process-count")?.set_text_content(Some(&format!("{:02} / 10", index + 1)));
            element(document, "[data-carousel-prev]")?.set_attribute("aria-label", lang.text("Előző lépés", "Previous step"))?;
            element(document, "[data-carousel-next]")?.set_attribute("aria-label", lang.text("Következő lépés", "Next step"))?;
            for i in 0..10 {
                let dot = element(document, &format!("[data-carousel-dot='{i}']"))?;
                dot.set_attribute("aria-pressed", if i == index { "true" } else { "false" })?;
                dot.set_attribute("aria-label", &format!("{} {}", lang.text("Lépés", "Step"), i + 1))?;
            }
        }
        let nodes = document.query_selector_all("[data-i18n]")?;
        for i in 0..nodes.length() {
            if let Some(el) = nodes.item(i).and_then(|n| n.dyn_into::<Element>().ok()) {
                if let Some(key) = el.get_attribute("data-i18n") {
                    if let Some(text) = self.translations[&key][lang.code()].as_str() {
                        el.set_inner_html(text);
                    }
                }
            }
        }
        for code in ["hu", "en"] {
            element(document, &format!("[data-language='{code}']"))?
                .set_attribute("aria-pressed", if code == lang.code() { "true" } else { "false" })?;
        }
        let toggle = element(document, ".theme-toggle")?;
        toggle.set_inner_html(if self.dark { SUN } else { MOON });
        let label = if self.dark { lang.text("Világos mód", "Light mode") } else { lang.text("Sötét mód", "Dark mode") };
        toggle.set_attribute("aria-label", label)?;
        toggle.set_attribute("title", label)?;
        toggle.set_attribute("aria-pressed", if self.dark { "false" } else { "true" })?;
        element(document, "nav")?.set_attribute("aria-label", lang.text("Főmenü", "Main navigation"))?;
        element(document, ".brand")?.set_attribute("aria-label", lang.text("JREPAS kezdőlap", "JREPAS home"))?;
        document.set_title(lang.text("Répás János - Grafikai tervezés", "János Répás - Graphic Design"));
        let project = document.location().and_then(|l| l.pathname().ok()).is_some_and(|p| p.ends_with("packaging.html"));
        let description = if project {
            lang.text("Csomagolástervezés és nyomdai kivitelezés — Répás János portfóliója.", "Packaging design and print production — János Répás portfolio.")
        } else {
            lang.text("Répás János — grafikai tervezés, csomagolás és márkaarculat.", "János Répás — graphic design, packaging and visual identities.")
        };
        element(document, "meta[name='description']")?.set_attribute("content", description)?;
        element(document, "meta[name='theme-color']")?.set_attribute("content", if self.dark { "#080808" } else { "#ffffff" })?;
        if let Some(image) = document.query_selector(".hero-image img")? {
            image.set_attribute("alt", lang.text("Sárga és fekete geometrikus formák fehér stúdióháttér előtt", "Sculptural yellow and black shapes on a white studio background"))?;
        }
        let images = document.query_selector_all(".project img, .case-image img")?;
        for i in 0..images.length() {
            if let Some(image) = images.item(i).and_then(|n| n.dyn_into::<Element>().ok()) {
                image.set_attribute("alt", lang.text("Csomagolástervezési projekt", "Packaging design project"))?;
            }
        }
        root.set_attribute("data-runtime", "rust-wasm")?;
        Ok(())
    }
    fn render_or_log(&self) {
        if let Err(error) = self.render() { web_sys::console::error_1(&error); }
    }
}

#[wasm_bindgen(start)]
pub fn start() -> Result<(), JsValue> {
    let window = web_sys::window().ok_or_else(|| JsValue::from_str("Window unavailable"))?;
    let document = window.document().ok_or_else(|| JsValue::from_str("Document unavailable"))?;
    let root = element(&document, "html")?;
    let country = root.get_attribute("data-country");
    let storage = window.local_storage().ok().flatten();
    let language = stored(&storage, "jrepas-language-choice").as_deref().and_then(Language::parse)
        .unwrap_or_else(|| default_language(country.as_deref(), &window.navigator().language().unwrap_or_default()));
    let media = window.match_media("(prefers-color-scheme: dark)")?;
    let (dark, manual_theme) = saved_theme(stored(&storage, "jrepas-theme").as_deref(), media.as_ref().is_some_and(|m| m.matches()));
    let translations = serde_json::from_str(COPY).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let app = Rc::new(RefCell::new(App { document: document.clone(), storage, language, dark, manual_theme, translations, carousel_index: 0 }));
    app.borrow().render()?;
    for code in ["hu", "en"] {
        let state = Rc::clone(&app);
        let callback = Closure::<dyn FnMut(Event)>::new(move |_| {
            let mut state = state.borrow_mut();
            if let Some(language) = Language::parse(code) { state.language = language; }
            if let Some(storage) = &state.storage { let _ = storage.set_item("jrepas-language-choice", code); }
            state.render_or_log();
        });
        element(&document, &format!("[data-language='{code}']"))?.add_event_listener_with_callback("click", callback.as_ref().unchecked_ref())?;
        callback.forget();
    }
    let state = Rc::clone(&app);
    let callback = Closure::<dyn FnMut(Event)>::new(move |_| {
        let mut state = state.borrow_mut();
        state.dark = !state.dark;
        state.manual_theme = true;
        if let Some(storage) = &state.storage { let _ = storage.set_item("jrepas-theme", if state.dark { "dark" } else { "light" }); }
        state.render_or_log();
    });
    element(&document, ".theme-toggle")?.add_event_listener_with_callback("click", callback.as_ref().unchecked_ref())?;
    callback.forget();
    if let Some(carousel) = document.query_selector(".process-carousel")? {
        for i in 0..12 {
            let selector = if i == 10 { "[data-carousel-prev]".to_string() } else if i == 11 { "[data-carousel-next]".to_string() } else { format!("[data-carousel-dot='{i}']") };
            let state = Rc::clone(&app);
            let callback = Closure::<dyn FnMut(Event)>::new(move |_| {
                let mut state = state.borrow_mut();
                state.carousel_index = match i { 10 => (state.carousel_index + 9) % 10, 11 => (state.carousel_index + 1) % 10, _ => i };
                state.render_or_log();
            });
            element(&document, &selector)?.add_event_listener_with_callback("click", callback.as_ref().unchecked_ref())?;
            callback.forget();
        }
        let state = Rc::clone(&app);
        let callback = Closure::<dyn FnMut(KeyboardEvent)>::new(move |event: KeyboardEvent| {
            let mut state = state.borrow_mut();
            match event.key().as_str() {
                "ArrowLeft" => state.carousel_index = (state.carousel_index + 9) % 10,
                "ArrowRight" => state.carousel_index = (state.carousel_index + 1) % 10,
                _ => return,
            }
            event.prevent_default();
            state.render_or_log();
        });
        carousel.add_event_listener_with_callback("keydown", callback.as_ref().unchecked_ref())?;
        callback.forget();
    }
    if let Some(media) = media {
        let state = Rc::clone(&app);
        let callback = Closure::<dyn FnMut(MediaQueryListEvent)>::new(move |event: MediaQueryListEvent| {
            let mut state = state.borrow_mut();
            if !state.manual_theme { state.dark = event.matches(); state.render_or_log(); }
        });
        media.add_event_listener_with_callback("change", callback.as_ref().unchecked_ref())?;
        callback.forget();
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn visitor_country_takes_priority_over_browser_language() {
        assert_eq!(default_language(Some("HU"), "en-US"), Language::Hu);
        assert_eq!(default_language(Some("DE"), "hu-HU"), Language::En);
        assert_eq!(default_language(Some("US"), "hu"), Language::En);
        assert_eq!(default_language(None, "hu-HU"), Language::Hu);
        assert_eq!(default_language(Some("XX"), "hu"), Language::Hu);
        assert_eq!(default_language(None, "fr"), Language::En);
    }
    #[test]
    fn only_explicit_theme_choices_override_system() {
        assert_eq!(saved_theme(None, true), (true, false));
        assert_eq!(saved_theme(Some("invalid"), false), (false, false));
        assert_eq!(saved_theme(Some("light"), true), (false, true));
        assert_eq!(saved_theme(Some("dark"), false), (true, true));
    }
    #[test]
    fn every_translation_has_both_languages() {
        let copy: Value = serde_json::from_str(COPY).expect("valid translations");
        for (key, entry) in copy.as_object().unwrap() {
            for lang in ["hu", "en"] { assert!(!entry[lang].as_str().unwrap_or_default().is_empty(), "{key}/{lang}"); }
        }
    }
}
