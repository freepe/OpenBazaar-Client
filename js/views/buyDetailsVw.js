var __ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    numberSpinners = require('../utils/numberSpinners'),
    loadTemplate = require('../utils/loadTemplate');
Backbone.$ = $;

module.exports = Backbone.View.extend({

  events: {
    'change .js-buyWizardQuantity': 'changeQuantity',
    'click .js-goToPurchases': 'goToPurchases'
  },

  initialize: function() {
    "use strict";
    var currentShippingPrice = 0,
        currentShippingBTCPrice = 0,
        recipient = this.model.get('page').profile.handle || this.model.get('page').profile.guid;

    this.model.set('currentShippingPrice', currentShippingPrice);
    this.model.set('currentShippingBTCPrice', currentShippingBTCPrice);

    this.model.set('currentShippingDisplayPrice', new Intl.NumberFormat(window.lang, {
      style: 'currency',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: this.model.get('userCurrencyCode')
    }).format(currentShippingPrice));

    this.model.set('recipient', recipient);

    this.listenTo(this.model, 'change:selectedModerator change:selectedAddress', function(){
      this.render();
    });

    this.render();
  },


  render: function(){
    var self = this;
    loadTemplate('./js/templates/buyDetails.html', function(loadedTemplate) {
      var currentShippingPrice = 0,
          currentShippingBTCPrice = 0,
          shipToCountry = self.model.get('selectedAddress') ? self.model.get('selectedAddress').country : "";

      if(shipToCountry && self.model.get('vendor_offer').listing.shipping.free !== true) {
        if(shipToCountry != self.model.get('vendor_offer').listing.shipping.shipping_origin) {
          currentShippingPrice = self.model.get('internationalShipping');
          currentShippingBTCPrice = self.model.get('internationalShippingBTC');
          self.model.set('shippingType', 'international');
        } else {
          currentShippingPrice = self.model.get('domesticShipping');
          currentShippingBTCPrice = self.model.get('domesticShippingBTC');
          self.model.set('shippingType', 'domestic');
        }
      }
      self.model.set('currentShippingPrice', currentShippingPrice);
      self.model.set('currentShippingBTCPrice', currentShippingBTCPrice);

      self.model.set('currentShippingDisplayPrice', new Intl.NumberFormat(window.lang, {
        style: 'currency',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currency: this.model.get('userCurrencyCode')
      }).format(currentShippingPrice));

      self.$el.html(loadedTemplate(self.model.toJSON()));

      //this does not add it to the DOM, that is done by the parent view
      self.setQuantity(1);

      numberSpinners(self.$el);
    });
    return this;
  },

  changeQuantity: function(e) {
    "use strict";
    this.setQuantity($(e.target).val());
  },

  setQuantity: function(quantity){
    "use strict";
    console.log(this.model.get('currentShippingBTCPrice'))
    var self = this,
        newAttributes = {},
        userCurrency = this.model.get('userCurrencyCode'),
        totalItemPrice = this.model.get('price') * quantity,
        totalShipping = this.model.get('currentShippingPrice') * quantity,
        moderatorPercentage = this.model.get('selectedModerator') ? (this.model.get('selectedModerator').fee).replace("%", "") * 0.01 : 0,
        moderatorPrice = moderatorPercentage ? totalItemPrice * moderatorPercentage : 0,
        moderatorTotal = moderatorPrice * quantity,
        totalPrice = totalItemPrice + totalShipping,
        newBTCDisplayPrice = Number((this.model.get('vendorBTCPrice') * quantity).toFixed(8)),
        newBTCShippingDisplayPrice = Number((this.model.get('currentShippingBTCPrice') * quantity).toFixed(8)),
        newDisplayPrice = (userCurrency == "BTC") ? Number(totalItemPrice.toFixed(8)) + " BTC" : new Intl.NumberFormat(window.lang, {
          style: 'currency',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          currency: userCurrency
        }).format(totalItemPrice),
        newDisplayShippingPrice = (userCurrency == "BTC") ? Number(totalShipping.toFixed(8)) + " BTC" : new Intl.NumberFormat(window.lang, {
          style: 'currency',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          currency: userCurrency
        }).format(totalShipping),
        newDisplayModeratorPrice = (userCurrency == "BTC") ? Number(moderatorTotal.toFixed(8)) + " BTC" : new Intl.NumberFormat(window.lang, {
          style: 'currency',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          currency: userCurrency
        }).format(moderatorTotal),
        totalBTCDisplayPrice = (this.model.get('vendorBTCPrice') + this.model.get('currentShippingBTCPrice')) * quantity,
        moderatorPriceBTC = moderatorPercentage ? totalBTCDisplayPrice * moderatorPercentage : 0,
        moderatorPriceString = this.model.get('userCurrencyCode') == 'BTC' ?
                               moderatorPriceBTC.toFixed(8) + " BTC" : moderatorPriceBTC.toFixed(8) + " BTC (" + newDisplayModeratorPrice + ")";

    this.$('.js-buyWizardBTCPrice').html(newBTCDisplayPrice+"BTC");
    this.$('.js-buyWizardBTCShippingPrice').html(newBTCShippingDisplayPrice+"BTC");

    if(userCurrency != 'BTC'){
      this.$('.js-buyWizardPrice').html("("+newDisplayPrice+")");
      this.$('.js-buyWizardShippingPrice').html("("+newDisplayShippingPrice+")");
    }
    this.$('.js-buyWizardModeratorPrice').attr('data-tooltip', moderatorPriceString);
    newAttributes.quantity = quantity;
    newAttributes.totalPrice = totalPrice;
    newAttributes.totalBTCDisplayPrice = totalBTCDisplayPrice;
    this.model.set(newAttributes);
  },

  lockForm: function(){
    "use strict";
    this.$('.js-buyWizardQuantity').prop('disabled', true);
    this.$('#buyWizardQuantity .numberSpinnerUp, #buyWizardQuantity .numberSpinnerDown').addClass('hide');
  },

  goToPurchases: function(){
    window.obEventBus.trigger('closeBuyWizard');
    Backbone.history.navigate('#transactions/purchases', {trigger:true});
  }

});