use std::{cell::RefCell, rc::Rc};
use serde_json::Value;
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{Document, Element, Event, MediaQueryListEvent, Storage};

const THEME_ICON: &str = r#"<svg class="theme-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><clipPath id="theme-horizon"><path d="M0 0h24v17H0Z"/></clipPath></defs><g class="theme-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g><g class="theme-moon"><path d="M20 13 C16 16 8 11 11 3 C6 3 3 7 3 12 C3 17 7 21 12 21 C16 21 20 18 20 13 Z"/></g><g class="theme-sunset"><g clip-path="url(#theme-horizon)"><g class="sunset-orbit"><circle cx="12" cy="10" r="4"/><path d="M12 1v2M3 10h2m14 0h2M5.5 3.5 7 5m10 0 1.5-1.5"/></g></g><path class="sunset-horizon" d="M3 17h18M7 21h10"/></g></svg>"#;
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
fn update_year(document: &Document) -> Result<(), JsValue> {
    let year = js_sys::Date::new_0().get_full_year().to_string();
    let label = element(document, "[data-current-year]")?;
    if label.text_content().as_deref() != Some(year.as_str()) {
        label.set_text_content(Some(&year));
    }
    Ok(())
}
fn update_quote_link(document: &Document, copy: &Value, language: Language) -> Result<(), JsValue> {
    let Some(link) = document.query_selector("#quote-mail")? else { return Ok(()); };
    let text = |key: &str| copy[key][language.code()].as_str().unwrap_or_default();
    let service = text("173");
    let subject = format!("{} – {}", text("166"), service);
    let body = format!("{}\n\n{}: {}\n\n{}:\n\n{}:\n\n{}:\n", text("167"), text("168"), service, text("169"), text("170"), text("171"));
    let subject = String::from(js_sys::encode_uri_component(&subject));
    let body = String::from(js_sys::encode_uri_component(&body));
    link.set_attribute("href", &format!("mailto:jrepas@icloud.com?subject={subject}&body={body}"))?;
    Ok(())
}

struct App {
    document: Document,
    storage: Option<Storage>,
    language: Language,
    dark: bool,
    manual_theme: bool,
    translations: Value,
    transition_version: u32,
}
impl App {
    fn render(&self) -> Result<(), JsValue> {
        let document = &self.document;
        update_year(document)?;
        let root = element(document, "html")?;
        let lang = self.language;
        root.set_attribute("lang", lang.code())?;
        root.set_attribute("data-theme", if self.dark { "dark" } else { "light" })?;
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
        // Preserve the SVG nodes so CSS can interpolate between icon states.
        if toggle.query_selector(".theme-icon")?.is_none() { toggle.set_inner_html(THEME_ICON); }
        toggle.set_attribute("data-icon-theme", if self.dark { "sun" } else { "moon" })?;
        let label = if self.dark { lang.text("Világos mód", "Light mode") } else { lang.text("Sötét mód", "Dark mode") };
        toggle.set_attribute("aria-label", label)?;
        toggle.set_attribute("title", label)?;
        toggle.set_attribute("aria-pressed", if self.dark { "false" } else { "true" })?;
        element(document, "nav")?.set_attribute("aria-label", lang.text("Főmenü", "Main navigation"))?;
        element(document, ".brand")?.set_attribute("aria-label", lang.text("JREPAS kezdőlap", "JREPAS home"))?;
        let title_key = "134";
        let description_key = "135";
        let title = self.translations[title_key][lang.code()].as_str().unwrap_or("Répás János – Grafikai tervezés | jrepas.hu");
        let description = self.translations[description_key][lang.code()].as_str().unwrap_or_default();
        document.set_title(title);
        element(document, "meta[name='description']")?.set_attribute("content", description)?;
        for selector in ["meta[property='og:title']", "meta[name='twitter:title']"] {
            if let Some(meta) = document.query_selector(selector)? { meta.set_attribute("content", title)?; }
        }
        for selector in ["meta[property='og:description']", "meta[name='twitter:description']"] {
            if let Some(meta) = document.query_selector(selector)? { meta.set_attribute("content", description)?; }
        }
        if let Some(meta) = document.query_selector("meta[property='og:locale']")? {
            meta.set_attribute("content", lang.text("hu_HU", "en_US"))?;
        }
        element(document, "meta[name='theme-color']")?.set_attribute("content", if self.dark { "#080808" } else { "#ffffff" })?;
        if let Some(source) = document.query_selector(".hero-image source")? {
            source.set_attribute("media", if self.dark { "all" } else { "not all" })?;
        }
        if let Some(image) = document.query_selector(".hero-image img")? {
            image.set_attribute("alt", lang.text("Hajlítható Duo telefon, a kijelzőjén sárga és fekete geometrikus grafikával", "Foldable Duo phone displaying yellow and black geometric artwork"))?;
        }
        let images = document.query_selector_all(".project img:not([alt='']), .case-image img")?;
        for i in 0..images.length() {
            if let Some(image) = images.item(i).and_then(|n| n.dyn_into::<Element>().ok()) {
                image.set_attribute("alt", lang.text("Doboz stancrajzának technikai illusztrációja", "Technical illustration of a box dieline"))?;
            }
        }
        update_quote_link(document, &self.translations, lang)?;
        if let Some(nav) = document.query_selector(".service-jump")? {
            nav.set_attribute("aria-label", lang.text("Szolgáltatás választása", "Choose a service"))?;
        }
        root.set_attribute("data-runtime", "rust-wasm")?;
        Ok(())
    }
    fn render_or_log(&self) {
        if let Err(error) = self.render() { web_sys::console::error_1(&error); }
    }
}


// Fade out the current copy, apply the latest requested state, then fade in.
// A version guard keeps rapid language/theme clicks from applying stale renders.
fn animate_render(app: &Rc<RefCell<App>>) {
    let Some(window) = web_sys::window() else { app.borrow().render_or_log(); return; };
    let reduced_motion = window.match_media("(prefers-reduced-motion: reduce)")
        .ok().flatten().is_some_and(|query| query.matches());
    let mut state = app.borrow_mut();
    state.transition_version = state.transition_version.wrapping_add(1);
    let version = state.transition_version;
    let Ok(root) = element(&state.document, "html") else { state.render_or_log(); return; };
    if reduced_motion {
        let _ = root.remove_attribute("data-switching");
        state.render_or_log();
        return;
    }
    let _ = root.set_attribute("data-switching", "true");
    drop(state);
    let pending = Rc::clone(app);
    let callback = Closure::once_into_js(move || {
        let state = pending.borrow();
        if state.transition_version != version { return; }
        state.render_or_log();
        let _ = root.remove_attribute("data-switching");
    });
    if window.set_timeout_with_callback_and_timeout_and_arguments_0(callback.unchecked_ref(), 130).is_err() {
        app.borrow().render_or_log();
        if let Ok(root) = element(&app.borrow().document, "html") { let _ = root.remove_attribute("data-switching"); }
    }
}

#[wasm_bindgen(start)]
pub fn start() -> Result<(), JsValue> {
    let window = web_sys::window().ok_or_else(|| JsValue::from_str("Window unavailable"))?;
    let document = window.document().ok_or_else(|| JsValue::from_str("Document unavailable"))?;
    let root = element(&document, "html")?;
    let country = root.get_attribute("data-country");
    let storage = window.local_storage().ok().flatten();
    let language = if country.as_deref() == Some("HU") { Language::Hu } else {
        stored(&storage, "jrepas-language-choice").as_deref().and_then(Language::parse)
            .unwrap_or_else(|| default_language(country.as_deref(), &window.navigator().language().unwrap_or_default()))
    };
    let media = window.match_media("(prefers-color-scheme: dark)")?;
    let (dark, manual_theme) = saved_theme(stored(&storage, "jrepas-theme").as_deref(), media.as_ref().is_some_and(|m| m.matches()));
    let translations = serde_json::from_str(COPY).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let app = Rc::new(RefCell::new(App { document: document.clone(), storage, language, dark, manual_theme, translations, transition_version: 0 }));
    app.borrow().render()?;
    // Update even if the page stays open over New Year's midnight.
    let year_document = document.clone();
    let year_callback = Closure::<dyn FnMut()>::new(move || {
        if let Err(error) = update_year(&year_document) { web_sys::console::error_1(&error); }
    });
    window.set_interval_with_callback_and_timeout_and_arguments_0(year_callback.as_ref().unchecked_ref(), 1_000)?;
    year_callback.forget();

    for code in ["hu", "en"] {
        let state = Rc::clone(&app);
        let callback = Closure::<dyn FnMut(Event)>::new(move |_| {
            {
                let mut app = state.borrow_mut();
                if let Some(language) = Language::parse(code) {
                    if app.language == language { return; }
                    app.language = language;
                }
                if let Some(storage) = &app.storage { let _ = storage.set_item("jrepas-language-choice", code); }
            }
            animate_render(&state);
        });
        element(&document, &format!("[data-language='{code}']"))?.add_event_listener_with_callback("click", callback.as_ref().unchecked_ref())?;
        callback.forget();
    }
    let state = Rc::clone(&app);
    let callback = Closure::<dyn FnMut(Event)>::new(move |_| {
        {
            let mut app = state.borrow_mut();
            if let Ok(toggle) = element(&app.document, ".theme-toggle") { let _ = toggle.set_attribute("data-theme-clicked", "true"); }
            app.dark = !app.dark;
            app.manual_theme = true;
            if let Some(storage) = &app.storage { let _ = storage.set_item("jrepas-theme", if app.dark { "dark" } else { "light" }); }
        }
        {
            let mut app = state.borrow_mut();
            // If a language fade is running, let it finish with the latest theme.
            if !element(&app.document, "html").ok().is_some_and(|root| root.has_attribute("data-switching")) {
                app.transition_version = app.transition_version.wrapping_add(1);
                app.render_or_log();
            }
        }
    });
    element(&document, ".theme-toggle")?.add_event_listener_with_callback("click", callback.as_ref().unchecked_ref())?;
    callback.forget();
    // A click shows the actual theme icon until the pointer leaves. A new hover
    // shows the static sunrise/sunset icon without obscuring click feedback.
    for event_name in ["pointerenter", "pointerleave"] {
        let toggle = element(&document, ".theme-toggle")?;
        let target = toggle.clone();
        let callback = Closure::<dyn FnMut(Event)>::new(move |_| {
            let _ = target.remove_attribute("data-theme-clicked");
        });
        toggle.add_event_listener_with_callback(event_name, callback.as_ref().unchecked_ref())?;
        callback.forget();
    }

    if let Some(media) = media {
        let state = Rc::clone(&app);
        let callback = Closure::<dyn FnMut(MediaQueryListEvent)>::new(move |event: MediaQueryListEvent| {
            {
                let mut app = state.borrow_mut();
                if app.manual_theme || app.dark == event.matches() { return; }
                app.dark = event.matches();
            }
            {
                let app = state.borrow();
                if !element(&app.document, "html").ok().is_some_and(|root| root.has_attribute("data-switching")) {
                    app.render_or_log();
                }
            }
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
