require 'digest/sha1'

class User < ActiveRecord::Base

  attr_accessor :password

  attr_accessible :crypted_password, :password, :password_confirmation

  EMAIL_USER = /[a-z]([\w+-_]*\.?[\w+-_]+)?/
  EMAIL_DOMAIN = /[a-z]\w*(\.\w+)?/
  EMAIL_DOMAIN_IP = /((\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])/

  validates_presence_of :login, :password, :email
  validates_length_of :login, :within => 2..25
  validates_length_of :password, :within => 4..40
  validates_confirmation_of :password
  validates_uniqueness_of :login, :email, :on => :create, :case_sensitive => false
  validates_format_of :email, :with => /^#{EMAIL_USER}@(#{EMAIL_DOMAIN}|#{EMAIL_DOMAIN_IP})$/i
  
  has_one :info, :dependent => :destroy, :class_name => "UserInfo", :foreign_key => "user_id"
  has_many :players
  has_many :user_balance_logs
  has_many :games, :through => :players
  has_many :notes

  before_save :crypt_password

  def authorize? password
    password.crypt(salt) == self.crypted_password
  end

  def have_money? type
    cash >= type.pay_for_play
  end
  
  def can_join? game
    can_create?(game.type) and not game.users.include?(self)
  end

  def can_create? type
    have_money?(type) and type.verify_user_level(level)
  end



  protected
  
  def crypt_password
    unless self.password.blank?
      self.salt = Digest::SHA1.hexdigest("#{Time.now}_#{login}") if new_record?
      self.crypted_password = password.crypt(salt)
    end
  end

end
