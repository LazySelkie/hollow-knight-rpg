import {EntitySheetHelper} from "./helper.js";

/**
 * Extend the base Item document, a custom template creation dialog.
 * @extends {Item}
 */
export class HKItem extends Item {

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }

}
