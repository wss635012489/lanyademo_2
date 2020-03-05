//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    deviceName: 'BLE SPP',
    //deviceName:'BBK_BLOOD',
    deviceId: '',
    services: '',
    notifyCharacteristicsId: '',//特征值
    balanceData: '',
    hexstr: '',
    connectedDeviceId: '',
    btn_text:'连接蓝牙',
    serviceId:''
  },
  reconnect(){
    this.init();
  },
  onUnload(){
    this.closeConnect();
  },
  onLoad() {
    var str = '020c31133230313331323031373335303234202d2d2d32f803020a32306e03'
    str = str.substr(0,50)
    console.log(str)
    //console.log(str.length)
    var date_hex = str.substr(10,20);
    var date_arr = []
    //console.log(date_hex)
    for (var i = 0; i < date_hex.length;i+=2){
      var item = parseInt(date_hex.substr(i, 2), 16) - 48
      date_arr.push(item) 
    }
    //console.log(date_arr)
    var measureDate = '20' + date_arr[4] + date_arr[5] + '-' + date_arr[0] + date_arr[1] + '-' + date_arr[2] + date_arr[3] + ' ' + date_arr[6] + date_arr[7] + ':' + date_arr[8] + date_arr[9]
    console.log(measureDate)

    var type = str.substr(32, 4)
    var type_arr = []
    for (var i = 0; i < type.length; i += 2) {
      var item = parseInt(type.substr(i, 2), 16) - 48
      type_arr.push(item)
    }
    //console.log(type_arr)
    var measureType = '' + type_arr[0] + type_arr[1]
    console.log(measureType)

    var value = str.substr(36, 8)
    var value_arr = []
    var isadd = true
    for (var i = 0; i < value.length; i += 2) {
      var item = parseInt(value.substr(i, 2), 16) - 48
      if (item < 0){
        console.log('测量数据有误')
        isadd = false
        break;
      }else {
        isadd = true
        value_arr.push(item)
      }
    }
    //console.log(value_arr)
    var measureValue = ''
    if (isadd){
      measureValue = '' + value_arr[0] + value_arr[1] + value_arr[2] + value_arr[3]
    } else {
      measureValue = ''
    }
    console.log(measureValue)
    
    var unit = str.substr(44, 2)
    var measureUnit = parseInt(unit, 16) - 48
    console.log(measureUnit)

    //this.init();
  },
  init(){
    var _this = this;
    if (wx.openBluetoothAdapter) {//初始化蓝牙
      wx.openBluetoothAdapter({
        success(res) {
          console.log('初始化成功')
          _this.getBluetoothAdapterState()
        },
        fail(err) {
          wx.showToast({
            title: '蓝牙模块初始化失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      wx.showToast({
        title: '当前微信客服端不支持蓝牙',
        icon: 'none',
        duration: 2000
      })
    }
  },
  getBluetoothAdapterState() {//检测本机蓝牙是否可用
    var _this = this;
    wx.getBluetoothAdapterState({
      success(res) {
        console.log('获取成功')
        console.log(res)
        if (res.available) {
          setTimeout(() => {
            _this.startBluetoothDevicesDiscovery()
          },1000)
        } else {
          wx.showToast({
            title: '当前蓝牙适配器不可用',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail(err) {
        wx.showToast({
          title: '获取蓝牙适配器状态失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  startBluetoothDevicesDiscovery() {//开始搜索蓝牙设备
    var _this = this;
    wx.startBluetoothDevicesDiscovery({
      success(res) {
        console.log('开始搜索')
        //console.log(res)
        /* 获取蓝牙设备列表 */
        _this.getBluetoothDevices()
      },
      fail(res) {
      }
    })
  },
  getBluetoothDevices() {//获取搜索到的蓝牙设备列表
    var _this = this;
    wx.getBluetoothDevices({
      services: [],
      allowDuplicatesKey: false,
      interval: 0,
      success: function (res) {
        console.log('获取搜索结果')
        console.log(res)
        if (res.devices.length > 0) {
          if (JSON.stringify(res.devices).indexOf(_this.data.deviceName) !== -1) {
            for (let i = 0; i < res.devices.length; i++) {
              if (_this.data.deviceName === res.devices[i].name) {
                /* 根据指定的蓝牙设备名称匹配到deviceId */
                _this.data.deviceId = res.devices[i].deviceId;
                _this.connectTO();
              };
            };
          } else {
            wx.showToast({
              title: '没有搜索到蓝牙设备',
              icon: 'none',
              duration: 2000
            })
          }
        } else {
          wx.showToast({
            title: '没有搜索到蓝牙设备',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail(res) {
        wx.showToast({
          title: '获取蓝牙设备列表失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  connectTO() {//连接设备
    var _this = this;
    wx.createBLEConnection({
      deviceId: _this.data.deviceId,
      success: function (res) {
        console.log('连接成功')
        //console.log(res)
        _this.data.connectedDeviceId = _this.data.deviceId;
        /* 4.获取连接设备的service服务 */
        _this.getBLEDeviceServices();
        wx.stopBluetoothDevicesDiscovery({//监听低功耗蓝牙连接状态的改变事件。包括开发者主动连接或断开连接，设备丢失，连接异常断开等等
          success: function (res) {
            console.log('连接成功，停止搜索')
            console.log(res)
          },
          fail(res) {

          },
          complete(){

          }
        })
        _this.onBlueLinkStateChange();
        _this.setData({
          btn_text:'连接成功'
        })
      },
      fail: function (res) {
        wx.showToast({
          title: '连接蓝牙失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  getBLEDeviceServices() {//获取设备的service服务,获取的serviceId有多个要试着连接最终确定哪个是稳定版本的service,获取服务完获取设备特征值
    var _this = this;
    wx.getBLEDeviceServices({
      deviceId: _this.data.connectedDeviceId,
      success: function (res) {
        console.log('获取服务成功')
        console.log(res)
        _this.data.services = res.services
        /* 获取连接设备的所有特征值 */
        _this.getBLEDeviceCharacteristics()
      },
      fail: (res) => {
        wx.showToast({
          title: '获取蓝牙服务失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  getBLEDeviceCharacteristics() {//获取到的特征值有多个，最后要用的事能读，能写，能监听的那个值的uuid作为特征值id
    var _this = this;
    console.log('services')
    console.log(_this.data.services)
    var serviceId = ''
    for (var i in _this.data.services){
      var characteristics_slice = _this.data.services[i].uuid.slice(4, 8);
      if (characteristics_slice == 'FEE0' || characteristics_slice == 'FEE0'){
        serviceId = _this.data.services[i].uuid;
        break;
      }
    }
    this.setData({
      serviceId
    })
    console.log(serviceId)
    wx.getBLEDeviceCharacteristics({
      deviceId: _this.data.connectedDeviceId,
      serviceId: serviceId,
      success: function (res) {
        var characteristics = res.characteristics;      //获取到所有特征值
        var characteristics_length = characteristics.length;    //获取到特征值数组的长度
        console.log('获取到特征值', characteristics);
        console.log('获取到特征值数组长度', characteristics_length);
        /* 遍历数组获取notycharacteristicsId */
        for (var index = 0; index < characteristics_length; index++) {
          var noty_characteristics_UUID = characteristics[index].uuid;    //取出特征值里面的UUID
          var characteristics_slice = noty_characteristics_UUID.slice(4, 8);   //截取4到8位
          /* 判断是否是我们需要的FEE1 */
          if (characteristics_slice == 'FEE1' || characteristics_slice == 'fee1') {
            var index_uuid = index;
            _this.setData({
              notifyCharacteristicsId: characteristics[index_uuid].uuid,    //需确定要的使能UUID
              characteristicsId: characteristics[index_uuid].uuid         //暂时确定的写入UUID
            });
            /* 遍历获取characteristicsId */
            for (var index = 0; index < characteristics_length; index++) {
              var characteristics_UUID = characteristics[index].uuid;    //取出特征值里面的UUID
              var characteristics_slice = characteristics_UUID.slice(4, 8);   //截取4到8位
              /* 判断是否是我们需要的FEE2 */
              if (characteristics_slice == 'FEE2' || characteristics_slice == 'fee2') {
                var index_uuid = index;
                _this.setData({
                  characteristicsId: characteristics[index_uuid].uuid         //确定的写入UUID
                });
              };
            };
          };
        };
        console.log('使能characteristicsId', _this.data.notifyCharacteristicsId);
        console.log('写入characteristicsId', _this.data.characteristicsId);
        _this.notifyBLECharacteristicValueChange();  
      },
      fail: function (err) {
        console.log(err)
        wx.showToast({
          title: '获取特征值失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  // getBLEDeviceCharacteristics() {//获取到的特征值有多个，最后要用的事能读，能写，能监听的那个值的uuid作为特征值id
  //   var _this = this;
  //   setTimeout(() => {
  //     wx.getBLEDeviceCharacteristics({
  //       deviceId: _this.data.connectedDeviceId,
  //       serviceId: _this.data.services[0].uuid,
  //       success: function (res) {
  //         console.log('获取特征值成功')
  //         console.log(res)
  //         for (var i = 0; i < res.characteristics.length; i++) {
  //           if (res.characteristics[i].properties.notify) {
  //             console.log(res.characteristics[i].uuid, '蓝牙特征值 ==========')
  //             /* 获取蓝牙特征值 */
  //             _this.data.notifyCharacteristicsId = res.characteristics[i].uuid
  //             // 启用低功耗蓝牙设备特征值变化时的 notify 功能
  //             _this.notifyBLECharacteristicValueChange()
  //           }
  //         }
  //       },
  //       fail: function (err) {
  //         console.log(err)
  //         wx.showToast({
  //           title: '获取特征值失败',
  //           icon: 'none',
  //           duration: 2000
  //         })
  //       }
  //     })
  //   }, 1000)
  // },
  writeSendLanya(value) {
    var _this = this;
    /* 将数值转为ArrayBuffer类型数据 */
    var typedArray = new Uint8Array(value.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }));
    var buffer = typedArray.buffer;
    wx.writeBLECharacteristicValue({
      deviceId: _this.data.connectedDeviceId,
      serviceId: _this.data.serviceId,
      characteristicId: _this.data.characteristicsId,
      value: buffer,
      success: function (res) {
        console.log('数据发送成功', res);
      },
      fail: function (res) {
        console.log('调用失败', res);
        /* 调用失败时，再次调用 */
        wx.writeBLECharacteristicValue({
          deviceId: _this.data.deviceId,
          serviceId: _this.data.serviceId,
          characteristicId: _this.data.characteristicsId,
          value: buffer,
          success: function (res) {
            console.log('第2次数据发送成功', res);
          },
          fail: function (res) {
            console.log('第2次调用失败', res);
            /* 调用失败时，再次调用 */
            wx.writeBLECharacteristicValue({
              deviceId: _this.data.deviceId,
              serviceId: _this.data.serviceId,
              characteristicId: _this.data.characteristicsId,
              value: buffer,
              success: function (res) {
                console.log('第3次数据发送成功', res);
              },
              fail: function (res) {
                console.log('第3次调用失败', res);
              }
            });
          }
        });
      }
    });
  },
  notifyBLECharacteristicValueChange() {//启动notify 蓝牙监听功能 然后使用 wx.onBLECharacteristicValueChange用来监听蓝牙设备传递数据
    var _this = this;
    console.log('6.启用低功耗蓝牙设备特征值变化时的 notify 功能')
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: _this.data.connectedDeviceId,
      serviceId: _this.data.serviceId,
      characteristicId: _this.data.notifyCharacteristicsId,
      success(res) {
        /*用来监听手机蓝牙设备的数据变化*/
        wx.onBLECharacteristicValueChange(function (res) {
          console.log('========================')
           console.log('监听特征值变化')
           //console.log(res)
          /**/
          // //血糖仪
          // var match16binary = _this.buf2string(res.value)
          // var balanceData = '';
          // var value = parseInt(match16binary.slice(match16binary.length - 8, match16binary.length - 6), 16)
          // var n = parseInt(match16binary.slice(match16binary.length - 6, match16binary.length - 5), 16)
          // console.log(value)
          // if (n >= 8) {
          //   balanceData = (value * Math.pow(10, n - 16)) * 1000
          // } else {
          //   balanceData = (value * Math.pow(10, n)) * 1000
          // }
          //血脂仪
          console.log(res.value)
          var balanceData = _this.buf2string(res.value)
          //var hexstr = _this.receiveData(res.value)
          console.log(balanceData)
          //console.log(hexstr)
          if (balanceData == '020a31306d03'){
            _this.writeSendLanya('020a3101549203');
          }
          if (balanceData.length == 40){
            _this.data.balanceData += '-' + balanceData
          } else if (balanceData.length == 22){
            _this.data.balanceData += balanceData
          }
          console.log(_this.data.balanceData)          
          // _this.setData({
          //   balanceData,
          //   hexstr
          // })
        })
        
      },
      fail(res) {
        wx.showToast({
          title: '启用低功耗蓝牙设备监听失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  // 断开设备连接
  closeConnect() {
    var _this = this;
    if (_this.data.connectedDeviceId) {
      console.log('断开设备连接1')
      wx.closeBLEConnection({
        deviceId: _this.data.connectedDeviceId,
        complete: function (res) {
          _this.closeBluetoothAdapter()
        }
      })
    } else {
      console.log('断开设备连接2')
      _this.closeBluetoothAdapter()
    }
  },
  // 关闭蓝牙模块
  closeBluetoothAdapter() {
    console.log('关闭蓝牙模块')
    this.setData({
      btn_text: '重新连接'
    })
    wx.closeBluetoothAdapter({
      success: function (res) {
        
      },
      fail: function (err) {
      }
    })
  },
  // 监听蓝牙连接情况
  onBlueLinkStateChange(){
    var _this  = this;
    wx.onBLEConnectionStateChange(function (res) {// 该方法回调中可以用于处理连接意外断开等异常情况
      console.log('蓝牙意外断开')
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      if (!res.connected){
        _this.closeConnect();
      }
    })
  },
  /*转换成需要的格式*/
  buf2string(buffer) {
    // var arr = Array.prototype.map.call(new Uint8Array(buffer), x => x)
    // return arr.map((char, i) => {
    //   return String.fromCharCode(char);
    // }).join('');
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },
  receiveData(buf) {
    return this.hexCharCodeToStr(this.ab2hex(buf))
  },
  /*转成二进制*/
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer), function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('')
  },
  /*转成可展会的文字*/
  hexCharCodeToStr(hexCharCodeStr) {
    var trimedStr = hexCharCodeStr.trim();
    var rawStr = trimedStr.substr(0, 2).toLowerCase() === '0x' ? trimedStr.substr(2) : trimedStr;
    var len = rawStr.length;
    var curCharCode;
    var resultStr = [];
    for (var i = 0; i < len; i = i + 2) {
      curCharCode = parseInt(rawStr.substr(i, 2), 16);
      resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join('');
  },
  ab2str(u, f) {
    var b = new Blob([u]);
    var r = new FileReader();
    r.readAsText(b, 'utf-8');
    r.onload = function () { if (f) f.call(null, r.result) }
  },
  
})
