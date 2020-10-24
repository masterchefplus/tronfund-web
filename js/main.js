const networks = {
    mainnet: "TNGqUiKycPN6tGpDp1nyrqYVj4yYcynw1z",
    shasta: "TFF15XCheTfshhJ7Szswi4JHCRPY15EGkN"
}

var contractAddress, tronWeb, currentAddress, network, tronLinkUrlPrefix, tronfund, waiting = 0, timer = null;
var uid, investor, investorInfo, investmentPlan, totalInvestments_ = 0, totalEarnings_ = 0, totalPaidDividends_ = 0;

async function init() {
  if (void 0 === window.tronWeb || !1 === window.tronWeb.defaultAddress.base58)
    return waiting += 1,
  5 == waiting ? showModal() : (console.error("Could not connect to TronLink."),
  void setTimeout(init, 1e3))
  setNetwork()
  tronWeb = window.tronWeb

  if (!contractAddress) {
    return
  }

  tronfund = await tronWeb.contract().at(contractAddress)
  currentAddress = tronWeb.defaultAddress.base58
  setTimeout(__init, 100)
  setInterval(getCurrentInvestorInfo, 10e3),
  setInterval(watchSelectedWallet, 2e3)
}

function showModal() {

  if (window.localStorage.language === 'en') {
    Swal.fire({
      type: 'warning',
      title: 'Please login to Tron Chrome Wallet',
      html: `<div>
    					<p>Please login to Tron Chrome Wallet</p>
              <p>If you haven't downloaded the web extension yet, download <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec"><strong>TronLink</strong></a> or <a  target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/tronpay/gjdneabihbmcpobmfhcnljaojmgoihfk"><strong>TronPay</strong></a> to work with Tron Fund</p>
              <p>Make sure you are on the mainnet network and not using test network</p>
              <p>After logging into the wallet or changing the account, please reload the page</p>
      		</div>`
    })
  } else {
    Swal.fire({
      type: 'warning',
      title: 'Пожалуйста, войдите в TronLink или TronPay',
      html: `<div>
    					<p>Пожалуйста, войдите в Tron Chrome Wallet</p>
              <p>Если вы еще не загрузили веб-расширение, загрузите <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec"><strong>TronLink</strong></a> или <a  target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/tronpay/gjdneabihbmcpobmfhcnljaojmgoihfk"><strong>TronPay</strong></a> чтоб работать с Tron Fund</p>
              <p>Убедитесь, что вы находитесь в сети mainnet и не используете testnet</p>
              <p>После входа в кошелек или смены аккаунта перезагрузите страницу</p>
      		</div>`
    })
  }
}

async function updateReferralLink() {
  const hash = window.btoa('tf' + await uid)

  if (uid.toNumber()) {
    jQuery('#ref-link').text('https://tronfund.co/?r=' + hash)
    jQuery('#ref-link-value').val('https://tronfund.co/?r=' + hash)
    jQuery('#act-copy').show()
  } else {
    if (window.localStorage.language === 'en') {
      jQuery('#ref-link').text('You need to invest to activate your referral link.')
    } else {
      jQuery('#ref-link').text('Вы должны инвестировать чтобы получить реферальную ссылку.')
    }
  }
}

async function __init() {
  $("#contract-balance").text(numberWithSpaces(tronWeb.fromSun(await tronWeb.trx.getBalance(contractAddress))))
  $("#wallet-address").text(currentAddress)
  // $("#wallet-balance").text(numberWithSpaces(tronWeb.fromSun(await tronWeb.trx.getBalance(currentAddress)), 2))

  await getCurrentInvestorInfo()
  addEventListeners()
}

async function getCurrentInvestorInfo() {
  totalInvestments_ = 0
  totalPaidDividends_ = 0
  totalEarnings_ = 0

  uid = await tronfund.getUIDByAddress(currentAddress).call()
  investor = await tronfund.uid2Investor(uid).call()
  investorInfo = await tronfund.getInvestorInfoByUID(uid).call()
  investmentPlan = await tronfund.getInvestmentPlanByUID(uid).call()

  showStats()
  updateReferralLink()
}

async function addEventListeners() {
  jQuery('button.btn-invest').click(function(e) {
    e.preventDefault()
    e.stopPropagation()

    invest()
  })

  jQuery('button.btn-withdraw').click(function(e) {
    e.preventDefault()
    e.stopPropagation()

    withdraw()
  })

  jQuery('#act-copy').click(function(e) {
    e.preventDefault()
    e.stopPropagation()

    copyReferralLink()
  })
}

function invest() {
    // if (await checkResources()) {
  let e = $("#invest-amount").val().trim();
  if (e <= 9 || !isFinite(e) || "" === e) {
    if (window.localStorage.language === 'en') {
      Swal.fire({
        type: 'error',
        title: 'Invalid TRX amount!',
      })
    } else {
      Swal.fire({
        type: 'error',
        title: 'Некорректная сумма в TRX!',
      })
    }
  } else {

    let refCode = parseInt(window.atob(jQuery.urlParam('r')).substring(2), 10) || 0, planId = 0

    tronfund.invest(refCode, planId).send({
        feeLimit: 2e7,
        shouldPollResponse: !1,
        callValue: tronWeb.toSun(e)
    }).then( r => {

      if (window.localStorage.language === 'en') {
        Swal.fire({
          type: 'success',
          title: 'Transaction successful!'
        })
      } else {
        Swal.fire({
          type: 'success',
          title: 'Транзакция успешна!',
        })
      }

      $("#invest-amount").val('')

      getCurrentInvestorInfo()

    }).catch( e => {
      Swal.fire({
        type: 'error',
        title: 'Ops...',
        text: 'Something went wrong!'
      })
      console.log(e)
    })
  }
}

function withdraw() {

  if (!parseFloat($("#withdrawable").text(), 10)) {
    if (window.localStorage.language === 'en') {
      Swal.fire({
        type: 'error',
        title: 'Your balance is empty!',
      })
    } else {
      Swal.fire({
        type: 'error',
        title: 'У вас недостаточно средств!',
      })
    }
  } else {
    tronfund.withdraw().send({
      feeLimit: 5e7,
      callValue: 0,
      shouldPollResponse: !1
    }).then( r => {
      if (window.localStorage.language === 'en') {
        Swal.fire({
          type: 'success',
          title: 'Transaction successful!'
        })
      } else {
        Swal.fire({
          type: 'success',
          title: 'Успешная транзакция!',
        })
      }
    }).catch( e => {
      Swal.fire({
        type: 'error',
        title: 'Ops...',
        text: 'Something went wrong!'
      })
      console.log(e)
    })
  }
}

function copyReferralLink() {
  document.getElementById('ref-link-value').select()
  try {
    var successful = document.execCommand('copy')
    var msg = successful ? 'successfully' : 'unsuccessfully'
  } catch (err) {
    console.log('Unable to copy text')
  }
}

function numberWithSpaces(num, decimals = false) {
    if (!decimals) {
      var parts = num.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return parts[0]
    } else {
      num = Number(num).toFixed(decimals)

      var parts = num.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      return parts.join(".")
    }
}

function getFormatedDate(timestamp) {
  var date = new Date(timestamp * 1000);
  var year = date.getFullYear();
  var month = ("0"+(date.getMonth()+1)).substr(-2);
  var day = ("0"+date.getDate()).substr(-2);
  var hour = ("0"+date.getHours()).substr(-2);
  var minutes = ("0"+date.getMinutes()).substr(-2);
  var seconds = ("0"+date.getSeconds()).substr(-2);

  return year+"-"+month+"-"+day+" "+hour+":"+minutes+":"+seconds;
}

async function showStats() {
  $("#contract-balance").text(numberWithSpaces(tronWeb.fromSun(await tronWeb.trx.getBalance(contractAddress))))

  $("#wallet-balance").text(numberWithSpaces(tronWeb.fromSun(await tronWeb.trx.getBalance(currentAddress)), 2))

  $("#referral-rewards").text(numberWithSpaces(tronWeb.fromSun(investor.availableReferrerEarnings), 2))

  $("#ref-first-level-count").text(investor.level1RefCount)
  $("#ref-second-level-count").text(investor.level2RefCount)
  $("#ref-third-level-count").text(investor.level3RefCount)

  $("#paid-referral-rewards").text(numberWithSpaces(tronWeb.fromSun(investor.referrerEarnings), 2))

  prepareTransactionHistory()

  $("#total-investments").text(numberWithSpaces(tronWeb.fromSun(totalInvestments_), 2))

  let withdrawable = totalEarnings_ + investor.availableReferrerEarnings.toNumber()
  $("#withdrawable").text(numberWithSpaces(tronWeb.fromSun(withdrawable), 2))

  $("#paid-dividends").text(numberWithSpaces(tronWeb.fromSun(totalPaidDividends_ + investor.referrerEarnings.toNumber()), 2))

  if (totalInvestments_) {
    $('.loading').hide()
    $('.no_investments_row').hide()
    $('.investments').fadeIn()
  } else {
    $('.loading').hide()
    $('.investments').hide()
    $('.no_investments_row').fadeIn()
  }

}

function prepareTransactionHistory() {
  jQuery('.investments__row').remove()

  let transactions = '';

  jQuery.each(investmentPlan[0], function(i, val) {
    totalInvestments_ += parseInt(investmentPlan[2][i], 10)
    totalPaidDividends_ += parseInt(investorInfo[7][i], 10)
    totalEarnings_ += parseInt(investorInfo[8][i], 10)

    let transcationDate = getFormatedDate(investmentPlan[1][i])
    let transcationAmount = numberWithSpaces(tronWeb.fromSun(investmentPlan[2][i]), 2)
    let transcationPaidOut = numberWithSpaces(tronWeb.fromSun(investmentPlan[3][i]), 2)
    let transcationAvailableForWithdraw = numberWithSpaces(tronWeb.fromSun(investorInfo[8][i]), 4)

    let transactionROI;
    switch (parseInt(investmentPlan[0][i], 10)) {
      case 3:
        transactionROI = 4.2
        break;
      case 2:
        transactionROI = 4.1
        break;
      case 1:
        transactionROI = 4.0
        break;
      case 0:
        transactionROI = 3.9
        break;
      default:
        transactionROI = 3.9
    }

    transactions += `<div class="investments__row">
      <div>
        <p>${transcationDate}</p>
      </div>
      <div>
        <p>${transcationAmount} <span>TRX</span></p>
      </div>
      <div>
        <p>${numberWithSpaces(transactionROI, 1)}%</p>
      </div>
      <div>
        <p>${transcationPaidOut} <span>TRX</span></p>
      </div>
      <div>
        <p>${transcationAvailableForWithdraw} <span>TRX</span></p>
      </div>
    </div>`
  })

  jQuery('.investments').append(transactions)
}

function setNetwork() {
  -1 != tronWeb.currentProvider().eventServer.host.indexOf("shasta")
    ? (network = "Shasta", contractAddress = networks.shasta,
    tronLinkUrlPrefix = "https://shasta.tronscan.org/#/transaction/")
    : (network = "Mainnet", contractAddress = networks.mainnet,
    tronLinkUrlPrefix = "https://tronscan.org/#/transaction/")
}

function watchSelectedWallet() {
  if (tronWeb.defaultAddress.base58 == currentAddress) {
    var e = -1 != tronWeb.currentProvider().eventServer.host.indexOf("shasta") ? "Shasta" : "Mainnet";
    network != e && window.location.reload()
  } else window.location.reload()
}

jQuery.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null) {
       return null;
    }
    return decodeURI(results[1]) || 0;
}

jQuery(document).ready(async () => {

  if (window.localStorage && !window.localStorage.language) {
    window.localStorage.language = 'en'
    jQuery('header a').removeClass('active')
    jQuery('header a').each(function() {
      if ($(this).attr('lang') === window.localStorage.language) {
        jQuery(this).addClass('active')
      }
    })
  } else {
    jQuery('header a').removeClass('active')
    jQuery('header a').each(function() {
      if ($(this).attr('lang') === window.localStorage.language) {
        jQuery(this).addClass('active')
      }
    })
  }

  $("#wallet-address").text('Sign in into your wallet')
  $("#ref-link").text('Sign in into your wallet')
  $("#contract-balance, #wallet-balance, #total-investments, #paid-dividends, #withdrawable, #referral-rewards, #paid-referral-rewards, #ref-first-level-count, #ref-second-level-count, #ref-third-level-count, .loading").text('...')

  jQuery('#faq .accordion > dt > a').click(function(e) {
    // e.preventDefault()
    // e.stopPropagation()

    if ($(this).hasClass('opened')) {
      $(this).parent().next().slideUp()
      $(this).removeClass('opened')
    } else {
      $(this).parent().next().slideDown()
      $(this).addClass('opened')
    }

    return false;
  })

  jQuery('header a').click(function(e) {
    jQuery('header a').removeClass('active')
    // e.preventDefault()

    if ($(this).attr('lang') !== window.localStorage.language) {
      if ($(this).attr('lang') === 'en') {
        window.localStorage.language = 'en'
      } else {
        window.localStorage.language = 'ru'
      }
    } else {
      window.localStorage.language = 'en'
    }

    $(this).addClass('active')
  })

  setTimeout(() => {
    init()
  }, 1e3)
})
