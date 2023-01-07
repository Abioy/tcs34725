enum RGB {
    //% block="红"
    RED,
    //% block="绿"
    GREEN,
    //% block="蓝"
    BLUE,
    //% block="全部"
    CLEAR
}
enum RGBv2 {
    //% block="红" color=#FF0000
    RED,
    //% block="绿" color=#00FF00
    GREEN,
    //% block="蓝" color=#0000FF
    BLUE,
    //% block="紫" color=#9400D3
    PURPLE,
    //% block="黄" color=#FFFF00
    YELLOW,
    //% block="橙" color=#FFA500
    ORANGE,
    //% block="未知" color=#808080
    UNKNOWN
}
enum INTERVAL {
    //% block="2.4ms"
    MS2_4 = 2.4,
    //% block="4.8ms"
    MS4_8 = 4.8,
    //% block="24ms"
    MS24 = 24,
    //% block="48ms"
    MS48 = 48,
    //% block="100ms"
    MS100 = 100,
}
enum GAIN {
    //% block="1倍"
    X1,
    //% block="4倍"
    X4,
    //% block="16倍"
    X16,
    //% block="60倍"
    X60,
}
//% weight=0 color=#3CB371 icon="\uf1b3" block="色彩传感器"
namespace TCS34725_SENSOR {
    enum LCS_Constants {
        // Constants
        ADDRESS = 0x29,
        ID = 0x12, // Register should be equal to 0x44 for the TCS34721 or TCS34725, or 0x4D for the TCS34723 or TCS34727.

        COMMAND_BIT = 0x80,

        ENABLE = 0x00,
        ENABLE_AIEN = 0x10, // RGBC Interrupt Enable
        ENABLE_WEN = 0x08, // Wait enable - Writing 1 activates the wait timer
        ENABLE_AEN = 0x02, // RGBC Enable - Writing 1 actives the ADC, 0 disables it
        ENABLE_PON = 0x01, // Power on - Writing 1 activates the internal oscillator, 0 disables it
        ATIME = 0x01, // Integration time
        WTIME = 0x03, // Wait time (if ENABLE_WEN is asserted)
        AILTL = 0x04, // Clear channel lower interrupt threshold
        AILTH = 0x05,
        AIHTL = 0x06, // Clear channel upper interrupt threshold
        AIHTH = 0x07,
        PERS = 0x0C, // Persistence register - basic SW filtering mechanism for interrupts
        PERS_NONE = 0x00, // Every RGBC cycle generates an interrupt
        PERS_1_CYCLE = 0x01, // 1 clean channel value outside threshold range generates an interrupt
        PERS_2_CYCLE = 0x02, // 2 clean channel values outside threshold range generates an interrupt
        PERS_3_CYCLE = 0x03, // 3 clean channel values outside threshold range generates an interrupt
        PERS_5_CYCLE = 0x04, // 5 clean channel values outside threshold range generates an interrupt
        PERS_10_CYCLE = 0x05, // 10 clean channel values outside threshold range generates an interrupt
        PERS_15_CYCLE = 0x06, // 15 clean channel values outside threshold range generates an interrupt
        PERS_20_CYCLE = 0x07, // 20 clean channel values outside threshold range generates an interrupt
        PERS_25_CYCLE = 0x08, // 25 clean channel values outside threshold range generates an interrupt
        PERS_30_CYCLE = 0x09, // 30 clean channel values outside threshold range generates an interrupt
        PERS_35_CYCLE = 0x0A, // 35 clean channel values outside threshold range generates an interrupt
        PERS_40_CYCLE = 0x0B, // 40 clean channel values outside threshold range generates an interrupt
        PERS_45_CYCLE = 0x0C, // 45 clean channel values outside threshold range generates an interrupt
        PERS_50_CYCLE = 0x0D, // 50 clean channel values outside threshold range generates an interrupt
        PERS_55_CYCLE = 0x0E, // 55 clean channel values outside threshold range generates an interrupt
        PERS_60_CYCLE = 0x0F, // 60 clean channel values outside threshold range generates an interrupt
        CONFIG = 0x0D,
        CONFIG_WLONG = 0x02, // Choose between short and long (12x) wait times via WTIME
        CONTROL = 0x0F, // Set the gain level for the sensor
        STATUS = 0x13,
        STATUS_AINT = 0x10, // RGBC Clean channel interrupt
        STATUS_AVALID = 0x01, // Indicates that the RGBC channels have completed an integration cycle

        CDATAL = 0x14, // Clear channel data
        CDATAH = 0x15,
        RDATAL = 0x16, // Red channel data
        RDATAH = 0x17,
        GDATAL = 0x18, // Green channel data
        GDATAH = 0x19,
        BDATAL = 0x1A, // Blue channel data
        BDATAH = 0x1B,

        GAIN_1X = 0x00, //  1x gain
        GAIN_4X = 0x01, //  4x gain
        GAIN_16X = 0x02, // 16x gain
        GAIN_60X = 0x03  // 60x gain
    }

    let LCS_integration_time_val = 0

    // I2C functions

    function I2C_WriteReg8(addr: number, reg: number, val: number) {
        let buf = pins.createBuffer(2)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        buf.setNumber(NumberFormat.UInt8BE, 1, val)
        pins.i2cWriteBuffer(addr, buf)
    }

    function I2C_ReadReg8(addr: number, reg: number): number {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        pins.i2cWriteBuffer(addr, buf)
        buf = pins.i2cReadBuffer(addr, 1)
        return buf.getNumber(NumberFormat.UInt8BE, 0);
    }

    function I2C_ReadReg16(addr: number, reg: number): number {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, reg)
        pins.i2cWriteBuffer(addr, buf)
        buf = pins.i2cReadBuffer(addr, 2)
        // Little endian
        return ((buf.getNumber(NumberFormat.UInt8BE, 1) << 8) | buf.getNumber(NumberFormat.UInt8BE, 0));
    }


    //% group="公共"
    //% blockId="initialize_sensor_v2" block="颜色传感器连接到 P19-P20 || 积分检测时间 %tm 信号放大 %gain"
    //% gain.defl = GAIN.X1
    //% tm.defl = INTERVAL.MS48
    //% expandableArgumentMode="toggle"
    export function LCS_initialize_v2(tm?: INTERVAL, gain?: GAIN) {
        //http://www.makerblog.at/2015/01/farben-erkennen-mit-dem-rgb-sensor-tcs34725-und-dem-arduino/
        // Make sure we're connected to the right sensor.
        let Tm = INTERVAL.MS48
        let Gain = GAIN.X1
        if (typeof tm != 'undefined') {
            Tm = tm
        }
        if (typeof gain != 'undefined') {
            Gain = gain
        }

        let chip_id = I2C_ReadReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ID))

        if (chip_id != 0x44) {
            return // Incorrect chip ID
        }

        // Set default integration time and gain.
        LCS_set_integration_time(Tm/1000)
        LCS_set_gain(Gain)

        // Enable the device (by default, the device is in power down mode on bootup).
        LCS_enable()
    }

    //% blockId="initialize_sensor" block="初始化颜色传感器"
    //% blockHidden=true
    export function LCS_initialize() {
        // Make sure we're connected to the right sensor.
        let chip_id = I2C_ReadReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ID))

        if (chip_id != 0x44) {
            return // Incorrect chip ID
        }

        // Set default integration time and gain.
        //LCS_set_integration_time(0.0048)
        //LCS_set_gain(LCS_Constants.GAIN_16X)
        //http://www.makerblog.at/2015/01/farben-erkennen-mit-dem-rgb-sensor-tcs34725-und-dem-arduino/
        LCS_set_integration_time(0.0504)
        LCS_set_gain(LCS_Constants.GAIN_1X)

        // Enable the device (by default, the device is in power down mode on bootup).
        LCS_enable()
    }

    function LCS_enable() {
        // Set the power and enable bits.
        I2C_WriteReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ENABLE), LCS_Constants.ENABLE_PON)
        basic.pause(10) // not sure if this is right    time.sleep(0.01) // FIXME delay for 10ms

        I2C_WriteReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ENABLE), (LCS_Constants.ENABLE_PON | LCS_Constants.ENABLE_AEN))
    }

    function LCS_set_integration_time(time: number) {
        let val = 0x100 - (time / 0.0024) // FIXME was cast to int type
        if (val > 255) {
            val = 255
        } else if (val < 0) {
            val = 0
        }
        I2C_WriteReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ATIME), val)
        LCS_integration_time_val = val
    }

    function LCS_set_gain(gain: number) {
        I2C_WriteReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.CONTROL), gain)
    }


    function LCS_set_led_state(state: boolean) {
        I2C_WriteReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.PERS), LCS_Constants.PERS_NONE)
        let val = I2C_ReadReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ENABLE))
        if (state) {
            val |= LCS_Constants.ENABLE_AIEN
        } else {
            val &= ~LCS_Constants.ENABLE_AIEN
        }
        I2C_WriteReg8(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.ENABLE), val)

        basic.pause(2 * (256 - LCS_integration_time_val) * 2.4) // delay for long enough for there to be new (post-change) complete values available
    }

    //% group="3颜色模式"
    //% blockId="getColorToVar" block="3色检测到的颜色"
    //% blockSetVariable=color3
    export function getColorToVar(): RGB {
        return getColor()
    }

    //% group="3颜色模式"
    //% blockId="colorCompare" block="3色 $x 是 $y"
    //% x.defl=color3
    //% x.shadow=variables_get
    //% y.shadow="myColorPickerV1"
    export function colorCompare(x: RGB, y: number): boolean {
        return x == colorType(y)
    }

    //% group="3颜色模式"
    //% blockId="getColor" block="3色读取到的颜色"
    export function getColor(): RGB {
        I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.CDATAL));
        basic.pause((256 - LCS_integration_time_val) * 2.4);
        let r = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.RDATAL));
        basic.pause((256 - LCS_integration_time_val) * 2.4);
        let g =  I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.GDATAL));
        basic.pause((256 - LCS_integration_time_val) * 2.4);
        let b = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.BDATAL));
         
        serial.writeLine("R:"+r + " G:" + g + " B:" + b);
         
        let color = RGB.RED;
        let max = r;
        if(g > max){
            max = g;
            color = RGB.GREEN;
        }
        if(b > max){
            max = b;
            color = RGB.BLUE;
        }

        serial.writeLine("val: " + color);
        return color;
    }

    //% group="3颜色模式"
    //% blockId="myColorPickerV1" block="%color"
    //% blockHidden=true
    //% color.fieldEditor="colornumber" 
    //% color.defl='#800080' weight=150
    //% color.fieldOptions.colours='["#ff0000","#00ff00","#0000ff"]'
    //% color.fieldOptions.columns=3 color.fieldOptions.className='rgbColorPicker' 
    export function myColorPickerV1(color: number): number {
        return color;
    }
    
    //% group="3颜色模式"
    //% blockId="colorType" block="3色%color"
    //% color.shadow="myColorPickerV1"
    export function colorType(color: number): RGB{
        switch(color) {
            case 0xff0000:
                return RGB.RED;
            case 0x00ff00:
                return RGB.GREEN;
            case 0x0000ff:
                return RGB.BLUE;
        }
        return RGB.CLEAR
    }

        
    //% group="3颜色模式"
    //% blockId="detectColorTypeV1" block="3色读取到了%color"
    //% color.shadow="myColorPickerV1"
    export function detectColorTypeV1(color: number): boolean {
        let c2 = RGB.CLEAR
        switch(color) {
            case 0xff0000:
                c2 = RGB.RED;
            case 0x00ff00:
                c2 = RGB.GREEN;
            case 0x0000ff:
                c2 = RGB.BLUE;
        }
        return c2 == getColor();
    }

    //% group="公共"
    //% blockId="getSensorData" block="读取颜色值 %colorId"
    export function getColorData(color: RGB): number {
        basic.pause((256 - LCS_integration_time_val) * 2.4);
        let sum = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.CDATAL));
        let vue = 0;
        switch (color) {
            case RGB.RED:
                vue = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.RDATAL));

                break;
            case RGB.GREEN:
                vue = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.GDATAL));

                break;
            case RGB.BLUE:
                vue = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.BDATAL));

                break;
            case RGB.CLEAR:
                return sum;
                break;

        }
        vue = Math.floor(vue / sum * 255);

        serial.writeLine("val: " + vue);
        return vue;
    }


    function LCS_get_raw_data(delay: boolean = false): number[] {
        if (delay) {
            // Delay for the integration time to allow reading immediately after the previous read.
            basic.pause((256 - LCS_integration_time_val) * 2.4)
        }

        let div = (256 - LCS_integration_time_val) * 1024
        let rgbc = [0, 0, 0, 0]
        rgbc[0] = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.RDATAL)) / div
        rgbc[1] = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.GDATAL)) / div
        rgbc[2] = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.BDATAL)) / div
        rgbc[3] = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.CDATAL)) / div
        if (rgbc[0] > 1) {
            rgbc[0] = 1
        }
        if (rgbc[1] > 1) {
            rgbc[1] = 1
        }
        if (rgbc[2] > 1) {
            rgbc[2] = 1
        }
        if (rgbc[3] > 1) {
            rgbc[3] = 1
        }
        return rgbc
    }


    function rawColorDistance(c1: number[], c2: number[]): number {
        let rmean = Math.floor((c1[0], c2[0])/2);
        let r = c1[0]-c2[0];
        let g = c1[1]-c2[1];
        let b = c1[2]-c2[2];
        return ((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8));
    }
    
    //% group="6种颜色模式[试用]"
    //% blockId="getColorV2" block="6色扫描到的颜色"
    export function getColorV2(): RGBv2 {
        //basic.pause((256 - LCS_integration_time_val) * 2.4);
        basic.pause((256 - LCS_integration_time_val) * 2.4 * 2);

        let r = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.RDATAL));
        let g =  I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.GDATAL));
        let b = I2C_ReadReg16(LCS_Constants.ADDRESS, (LCS_Constants.COMMAND_BIT | LCS_Constants.BDATAL));

        let avg = (r+g+b)/3
        r = r / avg;
        g = g / avg;
        b = b / avg;

        if ((r > 1.6 && r < 1.9) && (g < 0.75) && (b > 0.6 && b < 0.9)) {
            return RGBv2.RED
        } else if ((r < 0.95) && (g > 1.4) && (b < 0.9)) {
            return RGBv2.GREEN
        } else if ((r < 0.8) && (g < 1.2) && (b > 1.2)) {
            return RGBv2.BLUE
        } else if ((r > 1 && r < 1.15) && (g > 1.2 && g < 1.35) && (b > 0.55 && b < 0.75)) {
            return RGBv2.YELLOW
        } else if ((r > 1.4 && r < 1.8) && (g < 0.9 && g > 0.7) && (b < 0.6 && b > 0.45)) {
            return RGBv2.ORANGE
        } else if ((r > 0.8 && r < 0.9) && (g > 0.9 && g < 1.0) && (b > 1.2 && b < 1.3)) {
            return RGBv2.PURPLE
        }

        return RGBv2.UNKNOWN
    }
    
    //% group="6种颜色模式[试用]"
    //% blockId="myColorPicker" block="%color"
    //% blockHidden=true
    //% color.fieldEditor="colornumber" 
    //% color.defl='#800080' weight=150
    //% color.fieldOptions.colours='["#ff0000","#00ff00","#0000ff","#FFFF00","#FF7F50","#800080"]'
    //% color.fieldOptions.columns=3 color.fieldOptions.className='rgbColorPicker' 
    export function myColorPicker(color: number): number {
        return color;
    }

    //% group="6种颜色模式[试用]"
    //% blockId="colorTypeV2" block="6色%color"
    //% color.shadow="myColorPicker"
    export function colorTypeV2(color: number): RGBv2 {
        let c2 = RGBv2.UNKNOWN
        switch(color) {
            case 0xff0000:
                c2 = RGBv2.RED;
            case 0x00ff00:
                c2 = RGBv2.GREEN;
            case 0x0000ff:
                c2 = RGBv2.BLUE;
            case 0xffff00:
                c2 = RGBv2.YELLOW;
            case 0xFF7F50:
                c2 = RGBv2.ORANGE;
            case 0x800080:
                c2 = RGBv2.PURPLE;
        }
        return c2;
    }
    
    //% group="6种颜色模式[试用]"
    //% blockId="detectColorTypeV2" block="6色扫描到了%color"
    //% color.shadow="myColorPicker"
    export function detectColorTypeV2(color: number): boolean {
        let c2 = RGBv2.UNKNOWN
        switch(color) {
            case 0xff0000:
                c2 = RGBv2.RED;
            case 0x00ff00:
                c2 = RGBv2.GREEN;
            case 0x0000ff:
                c2 = RGBv2.BLUE;
            case 0xffff00:
                c2 = RGBv2.YELLOW;
            case 0xFF7F50:
                c2 = RGBv2.ORANGE;
            case 0x800080:
                c2 = RGBv2.PURPLE;
        }
        return c2 == getColorV2();
    }

}
 
