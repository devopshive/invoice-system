angular
  .module("invoicing", [])

  // The default logo for the invoice
  .constant("DEFAULT_LOGO", "images/victor_logo.png")

  .constant("PIPES_LOGO", "images/pipes.jpg")

  // The invoice displayed when the user first uses the app
  .constant("DEFAULT_INVOICE", {
    gst_integrated: 0,
    cgst: 9,
    sgst: 9,
    invoice_number: 10,
    current_time: new Date(),
    customer_info: {
      name: "",
      address1: "",
      address2: "",
      gst_number: "",
      postal: ""
    },
    company_info: {
      name: "Victor Polytubes",
      address1: "Delhi Bypass",
      address2: "Satrod Khas to Raipur Road",
      address3: "VPO Satrod Khas",
      address4: "Hisar, Haryana, India",
      postal: "125044",
      contact: "8901511889, 8168227895"
    },
    items: []
  })

  // Service for accessing local storage
  .service("LocalStorage", [
    function() {
      var Service = {};

      // Returns true if there is a logo stored
      var hasLogo = function() {
        return !!localStorage["logo"];
      };

      // Returns a stored logo (false if none is stored)
      Service.getLogo = function() {
        if (hasLogo()) {
          return localStorage["logo"];
        } else {
          return false;
        }
      };

      Service.setLogo = function(logo) {
        localStorage["logo"] = logo;
      };

      // Checks to see if an invoice is stored
      var hasInvoice = function() {
        return !(
          localStorage["invoice"] == "" || localStorage["invoice"] == null
        );
      };

      // Returns a stored invoice (false if none is stored)
      Service.getInvoice = function() {
        if (hasInvoice()) {
          return JSON.parse(localStorage["invoice"]);
        } else {
          return false;
        }
      };

      Service.setInvoice = function(invoice) {
        localStorage["invoice"] = JSON.stringify(invoice);
      };

      // Clears a stored logo
      Service.clearLogo = function() {
        localStorage["logo"] = "";
      };

      // Clears a stored invoice
      Service.clearinvoice = function() {
        localStorage["invoice"] = "";
      };

      // Clears all local storage
      Service.clear = function() {
        localStorage["invoice"] = "";
        Service.clearLogo();
      };

      return Service;
    }
  ])

  .service("Currency", [
    function() {
      var service = {};

      service.all = function() {
        return [
          {
            name: "British Pound (£)",
            symbol: "£"
          },
          {
            name: "Canadian Dollar ($)",
            symbol: "CAD $ "
          },
          {
            name: "Euro (€)",
            symbol: "€"
          },
          {
            name: "Indian Rupee (₹)",
            symbol: "₹"
          },
          {
            name: "Norwegian krone (kr)",
            symbol: "kr "
          },
          {
            name: "US Dollar ($)",
            symbol: "$"
          }
        ];
      };

      return service;
    }
  ])

  // Main application controller
  .controller("InvoiceCtrl", [
    "$scope",
    "$http",
    "DEFAULT_INVOICE",
    "DEFAULT_LOGO",
    "PIPES_LOGO",
    "LocalStorage",
    "Currency",
    "$filter",
    "$timeout",
    function(
      $scope,
      $http,
      DEFAULT_INVOICE,
      DEFAULT_LOGO,
      PIPES_LOGO,
      LocalStorage,
      Currency,
      $filter,
      $timeout
    ) {
      // Set defaults
      $scope.currencySymbol = "₹";
      $scope.logoRemoved = false;
      $scope.printMode = false;
      $scope.tickInterval = 1000; //in ms

      var tick = function() {
        $scope.invoice.current_time = Date.now(); // get the current time
        $timeout(tick, $scope.tickInterval); // reset the timer
      };

      $timeout(tick, $scope.tickInterval);

      (function init() {
        // Attempt to load invoice from local storage
        !(function() {
          // var invoice = LocalStorage.getInvoice();
          $scope.invoice = DEFAULT_INVOICE;
        })();

        // Set logo to the one from local storage or use default
        !(function() {
          var logo = LocalStorage.getLogo();
          $scope.logo = logo ? logo : DEFAULT_LOGO;
          $scope.pipes_logo = PIPES_LOGO;
        })();

        $scope.availableCurrencies = Currency.all();
      })();
      // Adds an item to the invoice's items
      $scope.addItem = function() {
        $scope.invoice.items.push({
          qty: 0,
          cost: 0,
          description: ""
        });
      };

      // Toggle's the logo
      $scope.toggleLogo = function(element) {
        $scope.logoRemoved = !$scope.logoRemoved;
        LocalStorage.clearLogo();
      };

      // Triggers the logo chooser click event
      $scope.editLogo = function() {
        // angular.element('#imgInp').trigger('click');
        document.getElementById("imgInp").click();
      };

      $scope.printInfo = function() {
        window.print();
      };

      // Remotes an item from the invoice
      $scope.removeItem = function(item) {
        $scope.invoice.items.splice($scope.invoice.items.indexOf(item), 1);
      };

      // Calculates the sub total of the invoice
      $scope.invoiceSubTotal = function() {
        var total = 0.0;
        angular.forEach($scope.invoice.items, function(item, key) {
          total += item.qty * item.cost;
        });
        return total;
      };

      // Calculates the tax of the invoice
      $scope.calculateSGST = function() {
        return ($scope.invoice.sgst * $scope.invoiceSubTotal()) / 100;
      };

      // Calculates the tax of the invoice
      $scope.calculateCGST = function() {
        return ($scope.invoice.cgst * $scope.invoiceSubTotal()) / 100;
      };

      // Calculates the tax of the invoice
      $scope.calculateIGST = function() {
        return ($scope.invoice.gst_integrated * $scope.invoiceSubTotal()) / 100;
      };

      // Calculates the grand total of the invoice
      $scope.calculateGrandTotal = function() {
        saveInvoice();
        return (
          $scope.calculateCGST() +
          $scope.calculateSGST() +
          $scope.calculateIGST() +
          $scope.invoiceSubTotal()
        );
      };

      // Clears the local storage
      $scope.clearLocalStorage = function() {
        var confirmClear = confirm(
          "Are you sure you would like to clear the invoice?"
        );
        if (confirmClear) {
          LocalStorage.clear();
          setInvoice(DEFAULT_INVOICE);
        }
      };

      // Sets the current invoice to the given one
      var setInvoice = function(invoice) {
        $scope.invoice = invoice;
        saveInvoice();
      };

      // Reads a url
      var readUrl = function(input) {
        if (input.files && input.files[0]) {
          var reader = new FileReader();
          reader.onload = function(e) {
            document
              .getElementById("company_logo")
              .setAttribute("src", e.target.result);
            LocalStorage.setLogo(e.target.result);
          };
          reader.readAsDataURL(input.files[0]);
        }
      };

      // Saves the invoice in local storage
      var saveInvoice = function() {
        LocalStorage.setInvoice($scope.invoice);
      };

      // Runs on document.ready
      angular.element(document).ready(function() {
        // Set focus
        document.getElementById("invoice-number").focus();

        // Changes the logo whenever the input changes
        document.getElementById("imgInp").onchange = function() {
          readUrl(this);
        };
      });
    }
  ]);
