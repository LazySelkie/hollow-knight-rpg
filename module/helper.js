
export class EntitySheetHelper {

  static getAttributeData(data) {
    // Called on opening item sheet, it seems
  }

  /* -------------------------------------------- */

  /** @override */
  static onSubmit(event) {
    // Closing the form/sheet will also trigger a submit, so only evaluate if this is an event.
    if ( event.currentTarget ) {
      // Exit early if this isn't a named attribute.
      if ( (event.currentTarget.tagName.toLowerCase() === 'input') && !event.currentTarget.hasAttribute('name')) {
        return false;
      }

      let attr = false;
      // If this is the attribute key, we need to make a note of it so that we can restore focus when its recreated.
      const el = event.currentTarget;
      if ( el.classList.contains("attribute-key") ) {
        let val = el.value;
        let oldVal = el.closest(".attribute").dataset.attribute;
        let attrError = false;
        // Prevent attributes that already exist as groups.
        // let groups = document.querySelectorAll('.group-key');
        // for ( let i = 0; i < groups.length; i++ ) {
        //   if (groups[i].value === val) {
        //     ui.notifications.error(game.i18n.localize("SIMPLE.NotifyAttrDuplicate") + ` (${val})`);
        //     el.value = oldVal;
        //     attrError = true;
        //     break;
        //   }
        // }
        // Handle value and name replacement otherwise.
        if ( !attrError ) {
          oldVal = oldVal.includes('.') ? oldVal.split('.')[1] : oldVal;
          attr = $(el).attr('name').replace(oldVal, val);
        }
      }

      // Return the attribute key if set, or true to confirm the submission should be triggered.
      return attr ? attr : true;
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
  static onAttributeRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.closest(".attribute").querySelector(".attribute-label")?.value;
    const chatLabel = label ?? button.parentElement.querySelector(".attribute-key").value;
    //const shorthand = game.settings.get("hollow-knight-rpg", "macroShorthand");

    // Use the actor for rollData so that formulas are always in reference to the parent actor.
    const rollData = this.actor.getRollData();
    let formula = button.closest(".attribute").querySelector(".attribute-value")?.value;

    // If there's a formula, attempt to roll it.
    if ( formula ) {
      let replacement = null;
      if ( formula.includes('@item.') && this.item ) {
        let itemName = this.item.name.slugify({strict: true}); // Get the machine safe version of the item name.
        replacement = `@items.${itemName}.attributes.`;//!!shorthand ? `@items.${itemName}.` : `@items.${itemName}.attributes.`;
        formula = formula.replace('@item.', replacement);
      }

      // Create the roll and the corresponding message
      let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
      });
    }
  }

  /* -------------------------------------------- */

  /**
   * Return HTML for a new attribute to be applied to the form for submission.
   *
   * @param {Object} items  Keyed object where each item has a "type" and "value" property.
   * @param {string} index  Numeric index or key of the new attribute.
   * @param {string|boolean} group String key of the group, or false.
   *
   * @returns {string} Html string.
   */
  static getAttributeHtml(items, index, group = false) {
    // Initialize the HTML.
    let result = '<div style="display: none;">';
    // Iterate over the supplied keys and build their inputs (including whether they need a group key).
    for (let [key, item] of Object.entries(items)) {
      result = result + `<input type="${item.type}" name="system.attributes${group ? '.' + group : '' }.attr${index}.${key}" value="${item.value}"/>`;
    }
    // Close the HTML and return.
    return result + '</div>';
  }
  
  /* -------------------------------------------- */

  /**
   * Update attributes when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateAttributes(formData, document) {
    // Рефакторнуть это нафиг, тут остатки групп и в целом не очень понятно как идут изменения
    console.log("updateAttributes===================")
    console.log({formData})
    // let groupKeys = [];

    // // Handle the free-form attributes list
    // const formAttrs = foundry.utils.expandObject(formData)?.system?.attributes || {};
    // console.log({formAttrs})
    // // Separate handling of proficiencies
    // const proficiencies = foundry.utils.expandObject(formData)?.prof || {};
    // const skills = foundry.utils.expandObject(formData)?.skill || {};
    // //console.log({proficiencies})
    // //console.log({skills})
    // for (let key in proficiencies) {
    //   delete formData[`prof.${key}`];
    // }
    // for (let key in skills) {
    //   delete formData[`skill.${key}`];
    // }
    // const profs = {};
    // for (let i = 0; i < proficiencies.name?.length; i++) {
    //   profs[`${i}`] = {
    //     name: proficiencies.name[i],
    //     rank: proficiencies.rank[i],
    //     skills: {}
    //   }
    //   for (let j = 4*i; j < 4*(i + 1); j++) {
    //     profs[`${i}`].skills[`${j - 4*i}`] = {
    //       name: skills.name[`${j}`],
    //       mastery: skills.mastery[`${j}`],
    //       description: skills.description[`${j}`]
    //     }
    //   }
    // }
    // //console.log(profs)
    // formData["system.proficiencies"] = profs;
    // //console.log("formData after adding profs: ", {formData})
    // //console.log(Object.values(formAttrs))
    // const attributes = Object.values(formAttrs).reduce((obj, v) => {
    //   //console.log(obj, v)
    //   let attrs = [];
    //   let group = null;
    //   // Handle attribute keys for grouped attributes.
    //   if ( !v["key"] ) {
    //     attrs = Object.keys(v);
    //     //console.log("Var grouped", attrs)
    //     attrs.forEach((attrKey, index) => {
    //       //console.log("attrs v: ", v[attrKey])
    //       group = Object.keys(formAttrs)[index];//group = v[attrKey];//group = v[attrKey]['group'];
    //       //console.log("attr group: ", group)
    //       groupKeys.push(group);
    //       let attr = v[attrKey];
    //       const k = this.cleanKey(v[attrKey]["key"] ? v[attrKey]["key"].trim() : attrKey.trim());
    //       delete attr["key"];
    //       // Add the new attribute if it's grouped, but we need to build the nested structure first.
    //       if ( !obj[group] ) {
    //         obj[group] = {};
    //       }
    //       obj[group][k] = attr;
    //     });
    //   }
    //   // Handle attribute keys for ungrouped attributes.
    //   else {
    //     //console.log("Var ungrouped")
    //     const k = this.cleanKey(v["key"].trim());
    //     delete v["key"];
    //     // Add the new attribute only if it's ungrouped.
    //     if ( !group ) {
    //       obj[k] = v;
    //     }
    //   }
    //   return obj;
    // }, {});

    // // Re-combine formData
    // formData = Object.entries(formData).reduce((obj, e) => {
    //   obj[e[0]] = e[1];
    //   return obj;
    // }, {_id: document.id, "system.attributes": attributes});
    // console.log("updateAttributes updated to this: ", formData)
    return formData;
  }

  /* -------------------------------------------- */

  /**
   * @see ClientDocumentMixin.createDialog
   */
  // Create Item/Actor menu (the one in Rightbar)
  static async createDialog(data={}, options={}) {

    // Collect data
    const documentName = this.metadata.name;
    const folders = game.folders.filter(f => (f.type === documentName) && f.displayed);
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", {type: label});

    // Identify the template Actor types
    const collection = game.collections.get(this.documentName);
    const templates = collection.filter(a => a.getFlag("hollow-knight-rpg", "isTemplate"));
    const defaultType = this.TYPES.filter(t => t !== CONST.BASE_DOCUMENT_TYPE)[0] ?? CONST.BASE_DOCUMENT_TYPE;
    const types = {
      [defaultType]: game.i18n.localize("SIMPLE.NoTemplate")
    }
    for ( let a of templates ) {
      types[a.id] = a.name;
    }

    // Render the document creation form
    const template = "templates/sidebar/document-create.html";
    const html = await renderTemplate(template, {
      name: data.name || game.i18n.format("DOCUMENT.New", {type: label}),
      folder: data.folder,
      folders: folders,
      hasFolders: folders.length > 1,
      type: data.type || templates[0]?.id || "",
      types: types,
      hasTypes: true
    });

    // Render the confirmation dialog window
    return Dialog.prompt({
      title: title,
      content: html,
      label: title,
      callback: html => {

        // Get the form data
        const form = html[0].querySelector("form");
        const fd = new FormDataExtended(form);
        let createData = fd.object;

        // Merge with template data
        const template = collection.get(form.type.value);
        if ( template ) {
          createData = foundry.utils.mergeObject(template.toObject(), createData);
          createData.type = template.type;
          delete createData.flags.worldbuilding.isTemplate;
          delete createData.flags.hkrpg.isTemplate;
        }

        // Merge provided override data
        createData = foundry.utils.mergeObject(createData, data, { inplace: false });
        return this.create(createData, {renderSheet: true});
      },
      rejectClose: false,
      options: options
    });
  }

  /* -------------------------------------------- */

  /**
   * Ensure the resource values are within the specified min and max.
   * @param {object} attrs  The Document's attributes.
   */
  static clampResourceValues(attrs) {
    const flat = foundry.utils.flattenObject(attrs);
    for ( const [attr, value] of Object.entries(flat) ) {
      const parts = attr.split(".");
      if ( parts.pop() !== "value" ) continue;
      const current = foundry.utils.getProperty(attrs, parts.join("."));
      if ( current?.dtype !== "Resource" ) continue;
      foundry.utils.setProperty(attrs, attr, Math.clamped(value, current.min || 0, current.max || 0));
    }
  }

  /* -------------------------------------------- */

  /**
   * Clean an attribute key, emitting an error if it contained invalid characters.
   * @param {string} key  The key to clean.
   * @returns {string}
   */
  static cleanKey(key) {
    const clean = key.replace(/[\s.]/g, "");
    if ( clean !== key ) ui.notifications.error("SIMPLE.NotifyAttrInvalid", { localize: true });
    return clean;
  }
}
