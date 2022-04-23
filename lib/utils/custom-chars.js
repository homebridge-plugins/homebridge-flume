import { inherits } from 'util';

export default class {
  constructor(api) {
    this.hapServ = api.hap.Service;
    this.hapChar = api.hap.Characteristic;
    this.uuids = {
      todayUsage: 'E966F001-079E-48FF-8F27-9C2605A29F52',
      monthUsage: 'E966F002-079E-48FF-8F27-9C2605A29F52',
      prevMonthUsage: 'E966F003-079E-48FF-8F27-9C2605A29F52',
    };
    const self = this;
    this.TodayUsage = function TodayUsage() {
      self.hapChar.call(this, 'Today Usage', self.uuids.todayUsage);
      this.setProps({
        format: self.hapChar.Formats.UINT32,
        perms: [self.hapChar.Perms.READ, self.hapChar.Perms.NOTIFY],
        unit: 'Gallons',
      });
      this.value = this.getDefaultValue();
    };
    this.MonthUsage = function MonthUsage() {
      self.hapChar.call(this, 'Month Usage', self.uuids.monthUsage);
      this.setProps({
        format: self.hapChar.Formats.UINT32,
        perms: [self.hapChar.Perms.READ, self.hapChar.Perms.NOTIFY],
        unit: 'Gallons',
      });
      this.value = this.getDefaultValue();
    };
    this.PrevMonthUsage = function PrevMonthUsage() {
      self.hapChar.call(this, 'Previous Month', self.uuids.prevMonthUsage);
      this.setProps({
        format: self.hapChar.Formats.UINT32,
        perms: [self.hapChar.Perms.READ, self.hapChar.Perms.NOTIFY],
        unit: 'Gallons',
      });
      this.value = this.getDefaultValue();
    };
    inherits(this.TodayUsage, this.hapChar);
    inherits(this.MonthUsage, this.hapChar);
    inherits(this.PrevMonthUsage, this.hapChar);
    this.TodayUsage.UUID = this.uuids.todayUsage;
    this.MonthUsage.UUID = this.uuids.monthUsage;
    this.PrevMonthUsage.UUID = this.uuids.prevMonthUsage;
  }
}
