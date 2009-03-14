class CreateUsers < ActiveRecord::Migration
  def self.up
    create_table :users do |t|
      t.string :login
      t.string :crypted_password
      t.string :salt
      t.integer :type
      t.string :email
      t.string :locate
      t.decimal :cash, :default => 0, :precision => 10, :scale => 2
      t.integer :chips, :default => 1000
      t.integer :level, :default => 0

      t.timestamps
    end
    
    5.times do |i|
      user = User.new :password => '1111', :password_confirmation => '1111'
      user.login = "u#{i}"
      user.email = "user#{i}@mail.ru"
      user.cash = 1000
      user.save
    end
  end

  def self.down
    drop_table :users
  end
end
